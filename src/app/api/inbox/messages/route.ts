import { NextResponse, type NextRequest } from "next/server";
import type { Message } from "@/types/inbox";
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

  const body = requestBody as SendMessageBody & { conversationId?: unknown };
  const rawId =
    typeof body.conversationId === "string" && body.conversationId.trim()
      ? body.conversationId.trim()
      : typeof body.contactId === "string" && body.contactId.trim()
      ? body.contactId.trim()
      : "";

  const messageText = typeof body.message === "string" ? body.message.trim() : "";
  if (!rawId || !messageText || messageText.length > maxMessageLength) {
    return NextResponse.json(
      { error: `Choose a conversation and enter a message of up to ${maxMessageLength} characters.` },
      { status: 400 },
    );
  }

  // 1. Resolve active conversation UUID and contact details
  let conversationId: string | null = null;
  let contact: { id: string; ig_account_id: string; ig_scoped_user_id: string } | null = null;

  const { data: convData } = await supabase
    .from("conversations")
    .select("id, contact_id, sender_id, workspace_id")
    .or(`id.eq.${rawId},contact_id.eq.${rawId}`)
    .limit(1)
    .maybeSingle();

  if (convData) {
    conversationId = convData.id;
    if (convData.contact_id) {
      const { data: c } = await supabase
        .from("contacts")
        .select("id, ig_account_id, ig_scoped_user_id")
        .eq("id", convData.contact_id)
        .maybeSingle();
      if (c) contact = c;
    }
    if (!contact && convData.sender_id) {
      const { data: c } = await supabase
        .from("contacts")
        .select("id, ig_account_id, ig_scoped_user_id")
        .eq("ig_scoped_user_id", convData.sender_id)
        .maybeSingle();
      if (c) contact = c;
    }
  }

  if (!contact) {
    const { data: c } = await supabase
      .from("contacts")
      .select("id, ig_account_id, ig_scoped_user_id")
      .eq("id", rawId)
      .maybeSingle();
    if (c) {
      contact = c;
      if (!conversationId) {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("contact_id", c.id)
          .maybeSingle();
        conversationId = existingConv?.id ?? null;
      }
    }
  }

  if (!contact) {
    console.error("Live Inbox contact lookup failed:", { rawId });
    return NextResponse.json({ error: "Conversation contact not found." }, { status: 404 });
  }

  // 2. Resolve Instagram business account credentials
  let account: { id: string; instagram_account_id: string; access_token_encrypted: string } | null = null;

  if (contact.ig_account_id) {
    const { data: acc } = await supabase
      .from("ig_accounts")
      .select("id, instagram_account_id, access_token_encrypted")
      .eq("id", contact.ig_account_id)
      .eq("is_active", true)
      .maybeSingle();
    if (acc) account = acc;
  }

  if (!account) {
    const { data: acc } = await supabase
      .from("ig_accounts")
      .select("id, instagram_account_id, access_token_encrypted")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (acc) account = acc;
  }

  if (!account?.instagram_account_id || !account.access_token_encrypted) {
    return NextResponse.json(
      { error: "This Instagram account is disconnected. Reconnect it in Settings and try again." },
      { status: 409 },
    );
  }

  try {
    // 3. Send DM via Meta Graph API
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
      typeof response.message_id === "string"
        ? response.message_id
        : `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sentAt = new Date().toISOString();
    const senderId = account.instagram_account_id;

    // Ensure conversation record exists
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          contact_id: contact.id,
          sender_id: contact.ig_scoped_user_id,
          instagram_conversation_id: `conv-${contact.ig_scoped_user_id}`,
          last_message: messageText,
          updated_at: sentAt,
        })
        .select("id")
        .single();
      conversationId = newConv?.id ?? rawId;
    }

    // 4. IMMEDIATELY insert into Supabase `messages` table
    const { data: insertedMessage, error: messageInsertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        instagram_message_id: externalMessageId,
        sender_id: senderId,
        message_text: messageText,
        is_from_user: true, // Outbound reply from bot/agent
        created_at: sentAt,
      })
      .select("*")
      .single();

    if (messageInsertError) {
      console.error("Supabase messages table insert error:", {
        error: messageInsertError,
        message: messageInsertError.message,
        details: messageInsertError.details,
        code: messageInsertError.code,
        conversationId,
      });
    }

    // 5. Update conversations table last_message and updated_at
    await supabase
      .from("conversations")
      .update({
        last_message: messageText,
        updated_at: sentAt,
      })
      .eq("id", conversationId);

    // Legacy conversations table mirror for backward compatibility
    try {
      await supabase.from("conversations").insert({
        contact_id: contact.id,
        direction: "outbound",
        message_body: messageText,
        message_text: messageText,
        last_message: messageText,
        sender_id: senderId,
        is_from_user: true,
        external_event_id: externalMessageId,
        created_at: sentAt,
      });
    } catch {
      // Non-blocking
    }

    const returnedMessage: Message = {
      id: insertedMessage?.id ?? externalMessageId,
      conversation_id: conversationId,
      contact_id: contact.id,
      instagram_message_id: externalMessageId,
      direction: "outbound",
      message_body: messageText,
      message_text: messageText,
      media_url: insertedMessage?.media_url ?? null,
      media_type: insertedMessage?.media_type ?? null,
      sender_id: senderId,
      is_from_user: true,
      created_at: sentAt,
    };

    return NextResponse.json({
      success: true,
      message: returnedMessage,
    });
  } catch (error) {
    console.error("Meta Graph API message sending failed:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      recipientId: contact.ig_scoped_user_id,
    });
    const message =
      error instanceof Error ? error.message : "Instagram message could not be sent.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
