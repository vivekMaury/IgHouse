import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const stateCookieName = "ighouse_instagram_oauth_state";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";
const permissions = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
];

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
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
    return NextResponse.redirect(
      new URL("/dashboard?instagram=error&reason=not_configured", request.url),
    );
  }

  const state = randomBytes(32).toString("hex");
  const callbackUrl = new URL("/api/auth/instagram/callback", request.url);
  const authorizationUrl = new URL(
    `https://www.facebook.com/${graphApiVersion}/dialog/oauth`,
  );
  authorizationUrl.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: permissions.join(","),
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(stateCookieName, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/instagram",
    maxAge: 10 * 60,
  });
  return response;
}
