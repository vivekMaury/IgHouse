import { NextResponse, type NextRequest } from "next/server";
import {
  decryptPageAccessToken,
  encryptPageAccessToken,
  refreshLongLivedAccessToken,
  sendInstagramDM,
} from "@/lib/instagram/api";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxMessageLength = 1000;

type SendMessageBody = {
  contactId?: unknown;
  message?: unknown;
};

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in to view messages." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationIdParam =
    searchParams.get("conversationId") ||
    searchParams.get("conversation_id") ||
    searchParams.get("contactId") ||
    searchParams.get("contact_id");

  if (!conversationIdParam) {
    return NextResponse.json(
      { error: "conversationId query parameter is required." },
      { status: 400 },
    );
  }

  try {
    // 1. Ensure conversation ID being passed matches the UUID primary key of the conversations table
    let resolvedConversationId = conversationIdParam;

    const { data: convRecord, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(`id.eq.${conversationIdParam},contact_id.eq.${conversationIdParam}`)
      .limit(1)
      .maybeSingle();

    if (convError) {
      console.error("Supabase conversation lookup error in API route:", {
        message: convError.message,
        details: convError.details,
        hint: convError.hint,
        code: convError.code,
        conversationIdParam,
      });
    } else if (convRecord?.id) {
      resolvedConversationId = convRecord.id;
    }

    // 2. Fetch messages using the correct table name `messages` and foreign key `conversation_id`
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, instagram_message_id, sender_id, message_text, media_url, media_type, is_from_user, created_at")
      .eq("conversation_id", resolvedConversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Supabase messages query error in API route:", {
        message: messagesError.message,
        details: messagesError.details,
        hint: messagesError.hint,
        code: messagesError.code,
        conversation_id: resolvedConversationId,
      });
      return NextResponse.json(
        {
          error: messagesError.message,
          details: messagesError.details,
          code: messagesError.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      conversation_id: resolvedConversationId,
      messages: messages ?? [],
    });
  } catch (error) {
    console.error("Unexpected error in messages GET API route:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      conversationId: conversationIdParam,
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch messages.",
      },
      { status: 500 },
    );
  }
}

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
        last_message: messageText,
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
      .select("id, contact_id, direction, message_body, message_text, media_url, media_type, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, created_at")
      .single();

    if (saveError) {
      console.error("Instagram message was sent but could not be saved to inbox history.", saveError);
      return NextResponse.json(
        { error: "Instagram accepted the message, but it could not be saved in inbox history. Refresh before retrying." },
        { status: 502 },
      );
    }

    // Mirror to messages table if conversation exists
    try {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("contact_id", contact.id)
        .maybeSingle();

      if (conv?.id) {
        await supabase.from("messages").insert({
          conversation_id: conv.id,
          instagram_message_id: externalMessageId,
          sender_id: account.instagram_account_id,
          message_text: messageText,
          is_from_user: false,
          created_at: sentAt,
        });
      }
    } catch {
      // Non-blocking
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
