import { NextResponse } from "next/server";
import { decryptPageAccessToken, subscribeInstagramMessages } from "@/lib/meta/graph-api";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to enable live Instagram messages." }, { status: 401 });
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("ig_accounts")
    .select("instagram_account_id, access_token_encrypted")
    .eq("is_active", true);

  if (accountsError) {
    console.error("Live Inbox could not load Instagram accounts for webhook setup.", accountsError);
    return NextResponse.json({ error: "Could not load connected Instagram accounts." }, { status: 500 });
  }
  if (!accounts?.length) {
    return NextResponse.json({ error: "Connect an Instagram account to enable live messages." }, { status: 409 });
  }

  try {
    for (const account of accounts) {
      if (!account.instagram_account_id || !account.access_token_encrypted) {
        throw new Error("A connected Instagram account is missing its messaging ID or access token.");
      }

      await subscribeInstagramMessages(account.instagram_account_id, {
        accessToken: decryptPageAccessToken(account.access_token_encrypted),
      });
    }

    return NextResponse.json({ subscribed: accounts.length });
  } catch (error) {
    console.error("Meta Instagram messaging webhook subscription failed.", error);
    return NextResponse.json(
      {
        error:
          "Meta could not enable message events for this account. Confirm the Instagram messaging permissions and the Messages webhook are enabled in the Meta app, then reconnect Instagram.",
      },
      { status: 502 },
    );
  }
}
