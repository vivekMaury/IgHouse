import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { encryptPageAccessToken } from "@/lib/meta/graph-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stateCookieName = "ighouse_instagram_oauth_state";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";

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

async function resolveOAuthWorkspace(
  userClient: ReturnType<typeof createClient>,
  userId: string,
) {
  let workspace: { id: string } | null = null;

  const { data: existingWorkspace, error: lookupError } = await userClient
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (lookupError) {
    console.error("[IG_AUTH_WORKSPACE_LOOKUP_ERROR]:", lookupError);
  } else {
    workspace = existingWorkspace;
  }

  if (!workspace) {
    const { data: createdWorkspace, error: insertError } = await userClient
      .from("workspaces")
      .insert([{ name: "Personal Workspace", owner_id: userId }])
      .select("id")
      .single();

    if (insertError) {
      console.error("[IG_AUTH_WORKSPACE_CREATE_ERROR]:", insertError);
    } else {
      workspace = createdWorkspace;
    }
  }

  if (!workspace?.id) {
    const adminClient = createAdminClient();
    const { data: resolvedId, error: resolveError } = await adminClient.rpc(
      "ensure_user_workspace",
      { target_user_id: userId },
    );
    if (resolveError) {
      throw new Error(`Unable to resolve a valid workspace: ${resolveError.message}`);
    }
    if (typeof resolvedId !== "string" || !resolvedId) {
      throw new Error("Workspace resolution did not return a valid workspace ID.");
    }
    workspace = { id: resolvedId };
  }

  const { data: membership, error: membershipLookupError } = await userClient
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipLookupError) throw membershipLookupError;

  if (!membership) {
    const { error: membershipInsertError } = await userClient
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "owner",
      });
    if (membershipInsertError) throw membershipInsertError;
  }

  return workspace.id;
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

    const pagesUrl = new URL(
      `https://graph.facebook.com/${graphApiVersion}/me/accounts`,
    );
    pagesUrl.searchParams.set("fields", "id,name");
    const pagesResponse = await fetch(pagesUrl, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
      cache: "no-store",
    });
    const pagesBody = (await pagesResponse.json()) as PageListResponse;
    console.log(
      "Instagram OAuth /me/accounts raw response:",
      JSON.stringify(pagesBody),
    );
    if (!pagesResponse.ok || !Array.isArray(pagesBody.data)) {
      throw new Error(pagesBody.error?.message ?? "Meta could not return your Pages.");
    }

    const tokenUrl = new URL(
      `https://graph.facebook.com/${graphApiVersion}/me/accounts`,
    );
    tokenUrl.searchParams.set("fields", "id,access_token");
    const pageTokensResponse = await fetch(tokenUrl, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
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
      instagramUrl.searchParams.set("fields", "instagram_business_account");
      const instagramResponse = await fetch(instagramUrl, {
        headers: { Authorization: `Bearer ${pageAccessToken}` },
        cache: "no-store",
      });
      const instagramBody =
        (await instagramResponse.json()) as PageInstagramResponse;
      console.log(
        `Instagram OAuth Page ${page.id} instagram_business_account raw response:`,
        JSON.stringify(instagramBody),
      );
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
      return redirectToDashboard(request, "error", "no_instagram_account");
    }

    const workspaceId = await resolveOAuthWorkspace(supabase, user.id);

    const accounts = instagramPages.map((page) => ({
      workspace_id: workspaceId,
      instagram_page_id: page.id as string,
      username:
        typeof page.instagram_business_account?.username === "string"
          ? page.instagram_business_account.username
          : null,
      access_token_encrypted: encryptPageAccessToken(page.access_token as string),
      is_active: true,
    }));

    const { error: saveError } = await supabase
      .from("ig_accounts")
      .upsert(accounts, { onConflict: "instagram_page_id" });
    if (saveError) throw saveError;

    return redirectToDashboard(request, "success");
  } catch (error) {
    console.error("[IG_AUTH_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Unknown Instagram connection error.";
    const response = NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url),
    );
    response.cookies.set(stateCookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/instagram",
      maxAge: 0,
    });
    return response;
  }
}
