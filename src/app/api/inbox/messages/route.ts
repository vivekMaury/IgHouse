import { NextResponse, type NextRequest } from "next/server";
import {
  decryptPageAccessToken,
  encryptPageAccessToken,
  refreshLongLivedAccessToken,
  sendInstagramDM,
} from "@/lib/meta/graph-api";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxMessageLength = 1000;

type SendMessageBody = {
  contactId?: unknown;
  message?: unknown;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in to send a message." }, { status: 401 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid message request." }, { status: 400 });
  }
  if (typeof requestBody !== "object" || requestBody === null) {
    return NextResponse.json({ error: "Invalid message request." }, { status: 400 });
  }

  const body = requestBody as SendMessageBody;
  const contactId = typeof body.contactId === "string" ? body.contactId : "";
  const messageText = typeof body.message === "string" ? body.message.trim() : "";
  if (!contactId || !messageText || messageText.length > maxMessageLength) {
    return NextResponse.json(
      { error: `Choose a contact and enter a message of up to ${maxMessageLength} characters.` },
      { status: 400 },
    );
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, ig_account_id, ig_scoped_user_id")
    .eq("id", contactId)
    .maybeSingle();

  if (contactError) {
    console.error("Live Inbox contact lookup failed.", contactError);
    return NextResponse.json({ error: "Could not access this conversation." }, { status: 500 });
  }
  if (!contact) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const { data: account, error: accountError } = await supabase
    .from("ig_accounts")
    .select("id, instagram_account_id, access_token_encrypted")
    .eq("id", contact.ig_account_id)
    .eq("is_active", true)
    .maybeSingle();

  if (accountError) {
    console.error("Live Inbox Instagram account lookup failed.", accountError);
    return NextResponse.json({ error: "Could not load the connected Instagram account." }, { status: 500 });
  }
  if (!account?.instagram_account_id || !account.access_token_encrypted) {
    return NextResponse.json(
      { error: "This Instagram account is disconnected. Reconnect it in Settings and try again." },
      { status: 409 },
    );
  }

  try {
    const response = await sendInstagramDM(
      account.instagram_account_id,
      contact.ig_scoped_user_id,
      messageText,
      {
        accessToken: decryptPageAccessToken(account.access_token_encrypted),
        refreshAccessToken: async (currentToken) => {
          const refreshedToken = await refreshLongLivedAccessToken(currentToken);
          const { error } = await supabase
            .from("ig_accounts")
            .update({
              access_token_encrypted: encryptPageAccessToken(refreshedToken),
            })
            .eq("id", account.id);
          if (error) {
            throw new Error(`Could not save the refreshed Instagram token: ${error.message}`);
          }
          return refreshedToken;
        },
      },
    );

    const externalMessageId =
      typeof response.message_id === "string" ? response.message_id : null;
    const sentAt = new Date().toISOString();
    const { data: savedMessage, error: saveError } = await supabase
      .from("conversations")
      .insert({
        contact_id: contact.id,
        direction: "outbound",
        message_body: messageText,
        message_text: messageText,
        sender_id: account.instagram_account_id,
        is_from_user: false,
        external_event_id: externalMessageId,
        metadata: {
          source: "live_inbox",
          external_message_id: externalMessageId,
          recipient_id: contact.ig_scoped_user_id,
        },
        created_at: sentAt,
      })
      .select("id, contact_id, direction, message_body, message_text, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, created_at")
      .single();

    if (saveError) {
      console.error("Instagram message was sent but could not be saved to inbox history.", saveError);
      return NextResponse.json(
        { error: "Instagram accepted the message, but it could not be saved in inbox history. Refresh before retrying." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: {
        ...savedMessage,
        direction: "outbound",
        message_body: savedMessage.message_text ?? savedMessage.message_body ?? messageText,
      },
    });
  } catch (error) {
    console.error("Meta rejected the Live Inbox message.", error);
    const message =
      error instanceof Error ? error.message : "Instagram message could not be sent.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
