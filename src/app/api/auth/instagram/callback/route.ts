import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { encryptPageAccessToken } from "@/lib/meta/graph-api";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const stateCookieName = "ighouse_instagram_oauth_state";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";

type OAuthTokenResponse = {
  access_token?: unknown;
  error?: { message?: string };
};

type PageAccount = {
  id?: unknown;
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

function redirectToDashboard(
  request: NextRequest,
  status: "connected" | "error",
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
  if (userError || !user) {
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

  try {
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
    pagesUrl.searchParams.set(
      "fields",
      "id,access_token,instagram_business_account{id,username}",
    );
    const pagesResponse = await fetch(pagesUrl, {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
      cache: "no-store",
    });
    const pagesBody = (await pagesResponse.json()) as PageListResponse;
    if (!pagesResponse.ok || !Array.isArray(pagesBody.data)) {
      throw new Error(pagesBody.error?.message ?? "Meta could not return your Pages.");
    }

    const instagramPages = (pagesBody.data as PageAccount[]).filter(
      (page) =>
        typeof page.id === "string" &&
        typeof page.access_token === "string" &&
        typeof page.instagram_business_account?.id === "string",
    );
    if (instagramPages.length === 0) {
      return redirectToDashboard(request, "error", "no_instagram_account");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) {
      return redirectToDashboard(request, "error", "no_workspace");
    }

    const accounts = instagramPages.map((page) => ({
      workspace_id: membership.workspace_id,
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

    return redirectToDashboard(request, "connected");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Instagram connection error.";
    console.error("Instagram OAuth callback failed:", message);
    return redirectToDashboard(request, "error", "connection_failed");
  }
}
