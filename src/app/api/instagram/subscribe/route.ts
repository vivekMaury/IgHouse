import { NextResponse, type NextRequest } from "next/server";
import {
  decryptPageAccessToken,
  subscribeInstagramMessages,
} from "@/lib/meta/graph-api";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscribeRequest = {
  workspace_id?: unknown;
  account_id?: unknown;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Sign in to enable live Instagram messages." },
      { status: 401 },
    );
  }

  let body: SubscribeRequest = {};
  const rawBody = await request.text();
  if (rawBody.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid subscription request." }, { status: 400 });
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid subscription request." }, { status: 400 });
    }
    body = parsed as SubscribeRequest;
  }

  const workspaceId =
    typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
  const accountId =
    typeof body.account_id === "string" ? body.account_id.trim() : "";
  if (
    (body.workspace_id !== undefined && !workspaceId) ||
    (body.account_id !== undefined && !accountId) ||
    (workspaceId && accountId)
  ) {
    return NextResponse.json(
      { error: "Provide either a workspace_id or an account_id." },
      { status: 400 },
    );
  }

  let query = supabase
    .from("ig_accounts")
    .select("id, instagram_page_id, instagram_account_id, access_token_encrypted")
    .eq("is_active", true);
  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  if (accountId) query = query.eq("id", accountId);

  const { data: accounts, error: accountsError } = await query;
  if (accountsError) {
    console.error("Could not load Instagram accounts for webhook subscription.", accountsError);
    return NextResponse.json(
      { error: "Could not load connected Instagram accounts." },
      { status: 500 },
    );
  }
  if (!accounts?.length) {
    return NextResponse.json(
      { error: "No active connected Instagram account was found." },
      { status: 404 },
    );
  }

  let subscribed = 0;
  try {
    for (const account of accounts) {
      if (!account.instagram_page_id || !account.access_token_encrypted) {
        throw new Error("A connected Instagram account is missing its Page ID or access token.");
      }

      await subscribeInstagramMessages(
        account.instagram_page_id,
        { accessToken: decryptPageAccessToken(account.access_token_encrypted) },
        account.instagram_account_id,
      );
      const { error: updateError } = await supabase
        .from("ig_accounts")
        .update({ is_webhook_subscribed: true })
        .eq("id", account.id);
      if (updateError) {
        throw new Error(`Meta subscribed successfully, but the status could not be saved: ${updateError.message}`);
      }
      subscribed += 1;
    }

    return NextResponse.json({ data: { success: true }, subscribed });
  } catch (error) {
    console.error("Meta Instagram messaging webhook subscription failed.", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Meta rejected the webhook subscription request.";
    for (const account of accounts.slice(subscribed)) {
      const { error: updateError } = await supabase
        .from("ig_accounts")
        .update({ is_webhook_subscribed: false })
        .eq("id", account.id);
      if (updateError) {
        console.error("Could not save failed Instagram webhook subscription state.", {
          accountId: account.id,
          error: updateError,
        });
      }
    }
    return NextResponse.json(
      {
        data: { success: false },
        error: errorMessage,
      },
      { status: 502 },
    );
  }
}
