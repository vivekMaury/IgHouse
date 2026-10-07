import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stateCookieName = "ighouse_instagram_oauth_state";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v20.0";
const permissions = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "business_management",
];

function buildAuthorizationUrl(request: NextRequest, appId: string, state: string) {
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

  return authorizationUrl;
}

export async function GET(request: NextRequest) {
  try {
    const wantsJson = request.nextUrl.searchParams.get("format") === "json";
    const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const encryptionKey = process.env.META_TOKEN_ENCRYPTION_KEY;
    if (
      !appId?.trim() ||
      !appSecret?.trim() ||
      !encryptionKey?.trim() ||
      !/^v\d+\.\d+$/.test(graphApiVersion)
    ) {
      return NextResponse.json(
        { error: "Missing Meta Configuration" },
        { status: 500 },
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) {
      if (wantsJson) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const state = randomBytes(32).toString("hex");
    const authorizationUrl = buildAuthorizationUrl(request, appId, state);
    const response = wantsJson
      ? NextResponse.json({ url: authorizationUrl.toString() })
      : NextResponse.redirect(authorizationUrl);

    response.cookies.set(stateCookieName, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/instagram",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error("[IG_AUTH_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Instagram OAuth could not be initialized.";
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
