import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  encryptPageAccessToken,
  subscribeInstagramMessages,
} from "@/lib/instagram/api";
import { ensureUserWorkspace } from "@/lib/workspaces/ensure-user-workspace";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stateCookieName = "ighouse_instagram_oauth_state";
const graphApiVersion =
  process.env.META_GRAPH_API_VERSION ??
  process.env.NEXT_PUBLIC_META_GRAPH_API_VERSION ??
  "v23.0";

type OAuthTokenResponse = {
  access_token?: unknown;
  error?: { message?: string };
};

type PageAccount = {
  id?: unknown;
  name?: unknown;
  access_token?: unknown;
  instagram_business_account?: {
    id?: unknown;
    username?: unknown;
    name?: unknown;
    profile_picture_url?: unknown;
    access_token?: unknown;
  } | null;
};

type PageListResponse = {
  data?: unknown;
  error?: { message?: string };
};

type PageInstagramResponse = {
  instagram_business_account?: PageAccount["instagram_business_account"];
  error?: { message?: string };
};

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function redirectToDashboard(
  request: NextRequest,
  status: "connected" | "success" | "error",
  reason?: string,
) {
  const destination = new URL("/dashboard", request.url);
  destination.searchParams.set("instagram", status);
  if (reason) destination.searchParams.set("reason", reason);

  const response = NextResponse.redirect(destination);
  response.cookies.set(stateCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/instagram",
    maxAge: 0,
  });
  return response;
}

function isMatchingState(expected: string | undefined, received: string | null) {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    if (url.searchParams.has("error")) {
      return redirectToDashboard(request, "error", "access_denied");
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !isMatchingState(request.cookies.get(stateCookieName)?.value, state)) {
      return redirectToDashboard(request, "error", "invalid_state");
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return redirectToDashboard(request, "error", "not_signed_in");
    }

    const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const encryptionKey = process.env.META_TOKEN_ENCRYPTION_KEY;
    if (
      !appId ||
      !appSecret ||
      !encryptionKey ||
      !/^v\d+\.\d+$/.test(graphApiVersion)
    ) {
      return redirectToDashboard(request, "error", "not_configured");
    }

    const callbackUrl = new URL("/api/auth/instagram/callback", request.url);
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: callbackUrl.toString(),
          code,
        }),
        cache: "no-store",
      },
    );
    const tokenBody = (await tokenResponse.json()) as OAuthTokenResponse;
    if (
      !tokenResponse.ok ||
      typeof tokenBody.access_token !== "string" ||
      !tokenBody.access_token
    ) {
      throw new Error(tokenBody.error?.message ?? "Meta did not return an access token.");
    }

    const userAccessToken = tokenBody.access_token;
    try {
      await syncAndSavePages(userAccessToken, user, supabase);
    } catch (syncErr: any) {
      if (syncErr?.message === "no_instagram_account") {
        return redirectToDashboard(request, "error", "no_instagram_account");
      }
      throw syncErr;
    }

    return redirectToDashboard(request, "success");
  } catch (error) {
    console.error("[IG_AUTH_ERROR]:", error);
    return redirectToDashboard(request, "error", "connection_failed");
  }
}

async function syncAndSavePages(
  userAccessToken: string,
  user: { id: string },
  supabase: ReturnType<typeof createClient>,
) {
  const pagesUrl = new URL(
    `https://graph.facebook.com/${graphApiVersion}/me/accounts`,
  );
  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}",
  );
  const pagesResponse = await fetch(pagesUrl, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
    cache: "no-store",
  });
  const pagesBody = (await pagesResponse.json()) as PageListResponse;
  if (!pagesResponse.ok || !Array.isArray(pagesBody.data)) {
    throw new Error(pagesBody.error?.message ?? "Meta could not return your Pages.");
  }

  const tokenUrl = new URL(
    `https://graph.facebook.com/${graphApiVersion}/me/accounts`,
  );
  tokenUrl.searchParams.set("fields", "id,access_token");
  const pageTokensResponse = await fetch(tokenUrl, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
    cache: "no-store",
  });
  const pageTokensBody = (await pageTokensResponse.json()) as PageListResponse;
  if (!pageTokensResponse.ok || !Array.isArray(pageTokensBody.data)) {
    throw new Error(pageTokensBody.error?.message ?? "Meta could not return Page access tokens.");
  }

  const pageTokens = new Map(
    (pageTokensBody.data as PageAccount[])
      .filter(
        (page): page is PageAccount & { id: string; access_token: string } =>
          typeof page.id === "string" && typeof page.access_token === "string",
      )
      .map((page) => [page.id, page.access_token]),
  );
  const instagramPages: Array<PageAccount & {
    id: string;
    access_token: string;
    instagram_business_account: NonNullable<PageAccount["instagram_business_account"]>;
  }> = [];

  for (const page of pagesBody.data as PageAccount[]) {
    if (typeof page.id !== "string") continue;
    const pageAccessToken = pageTokens.get(page.id);
    if (!pageAccessToken) {
      console.warn(
        "Instagram OAuth did not receive an access token for the returned Page.",
        { pageId: page.id, pageName: page.name ?? null },
      );
      continue;
    }

    const instagramUrl = new URL(
      `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(page.id)}`,
    );
    instagramUrl.searchParams.set(
      "fields",
      "instagram_business_account{id,username,name,profile_picture_url}",
    );
    const instagramResponse = await fetch(instagramUrl, {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      cache: "no-store",
    });
    const instagramBody =
      (await instagramResponse.json()) as PageInstagramResponse;
    if (!instagramResponse.ok) {
      throw new Error(
        instagramBody.error?.message ??
          `Meta could not read Instagram account data for Page ${page.id}.`,
      );
    }

    const instagramAccount = instagramBody.instagram_business_account;
    if (!instagramAccount || typeof instagramAccount.id !== "string") {
      console.warn(
        "Instagram OAuth Page has no linked instagram_business_account.",
        {
          pageId: page.id,
          pageName: page.name ?? null,
          instagramBusinessAccount: instagramAccount ?? null,
        },
      );
      continue;
    }

    instagramPages.push({
      ...page,
      id: page.id,
      access_token: pageAccessToken,
      instagram_business_account: instagramAccount,
    });
  }

  if (instagramPages.length === 0) {
    throw new Error("no_instagram_account");
  }

  const workspaceId = await ensureUserWorkspace(supabase, user.id);

  const accounts = await Promise.all(instagramPages.map(async (page) => {
    const instagramAccount = page.instagram_business_account;
    const accountName =
      nonEmptyString(instagramAccount.name) ??
      nonEmptyString(page.name) ??
      page.id;
    const username =
      nonEmptyString(instagramAccount.username) ??
      nonEmptyString(page.name) ??
      accountName;
    const accessToken =
      nonEmptyString(instagramAccount.access_token) ?? page.access_token;
    let isWebhookSubscribed = false;

    try {
      await subscribeInstagramMessages(page.id, {
        accessToken: page.access_token,
        apiVersion: graphApiVersion,
      }, typeof instagramAccount.id === "string" ? instagramAccount.id : null);
      isWebhookSubscribed = true;
    } catch (error) {
      console.error("Instagram OAuth could not subscribe the Page to message webhooks.", {
        pageId: page.id,
        error,
      });
    }

    return {
      workspace_id: workspaceId,
      instagram_page_id: page.id,
      instagram_account_id: instagramAccount.id,
      name: accountName,
      username,
      profile_picture_url:
        nonEmptyString(instagramAccount.profile_picture_url) ?? null,
      access_token_encrypted: encryptPageAccessToken(accessToken),
      is_webhook_subscribed: isWebhookSubscribed,
      is_active: true,
    };
  }));

  const { error: saveError } = await supabase
    .from("ig_accounts")
    .upsert(accounts, {
      onConflict: "instagram_page_id",
      ignoreDuplicates: false,
    });
  if (saveError) throw saveError;

  try {
    const connectedAccountsPayload = accounts.map((acc) => ({
      workspace_id: acc.workspace_id,
      instagram_account_id: acc.instagram_account_id,
      page_id: acc.instagram_page_id,
      name: acc.name,
      username: acc.username,
      profile_picture_url: acc.profile_picture_url,
      access_token: acc.access_token_encrypted,
      access_token_encrypted: acc.access_token_encrypted,
      is_active: acc.is_active,
      is_webhook_subscribed: acc.is_webhook_subscribed,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from("connected_accounts").upsert(connectedAccountsPayload, {
      onConflict: "instagram_account_id",
      ignoreDuplicates: false,
    });
  } catch {
    // Non-blocking fallback
  }

  return accounts;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as { accessToken?: unknown };
    const accessToken = typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Missing Facebook access token" }, { status: 400 });
    }

    const accounts = await syncAndSavePages(accessToken, user, supabase);
    return NextResponse.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map((acc) => ({
        id: acc.instagram_account_id,
        name: acc.name,
        username: acc.username,
      })),
    });
  } catch (error: any) {
    console.error("[IG_AUTH_TOKEN_ERROR]:", error);
    const isNoAccount = error?.message === "no_instagram_account";
    return NextResponse.json(
      {
        error: isNoAccount
          ? "No Instagram Business account was found linked to your Facebook Pages."
          : error instanceof Error
          ? error.message
          : "Failed to connect Instagram account.",
        code: isNoAccount ? "no_instagram_account" : "connection_failed",
      },
      { status: isNoAccount ? 404 : 500 },
    );
  }
}
