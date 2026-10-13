import { redirect } from "next/navigation";
import type { Conversation, Message } from "@/types/inbox";
import { createClient } from "@/utils/supabase/server";
import LiveInboxClient from "@/components/inbox/LiveInboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  let workspaceId: string | null = null;
  let initialContacts: Conversation[] = [];

  try {
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    workspaceId = membership?.workspace_id ?? null;

    // 1. Try querying conversations table
    const { data: convData } = await supabase
      .from("conversations")
      .select("id, workspace_id, instagram_conversation_id, sender_id, sender_name, sender_username, sender_avatar_url, last_message, media_url, media_type, updated_at, created_at")
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (Array.isArray(convData) && convData.length > 0) {
      initialContacts = convData.map((conv) => {
        const rawName =
          conv.sender_username?.trim() ||
          conv.sender_name?.trim();
        const displayName =
          rawName && !/^\d{10,}$/.test(rawName)
            ? rawName
            : conv.sender_id
            ? `User ${conv.sender_id.slice(-4)}`
            : "Instagram User";

        return {
          id: conv.id,
          workspace_id: conv.workspace_id,
          instagram_conversation_id: conv.instagram_conversation_id,
          sender_id: conv.sender_id ?? null,
          sender_name: conv.sender_name ?? null,
          sender_username: conv.sender_username ?? null,
          sender_avatar_url: conv.sender_avatar_url ?? null,
          last_message: conv.last_message ?? null,
          media_url: conv.media_url ?? null,
          media_type: conv.media_type ?? null,
          username: displayName,
          tags: [],
          last_interaction_at: conv.updated_at || conv.created_at,
        };
      });
    } else {
      // 2. Fallback to contacts table
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at")
        .order("last_interaction_at", { ascending: false, nullsFirst: false });
      if (contactsError) throw contactsError;

      initialContacts = (contacts ?? []).map((contact) => {
        const rawName =
          contact.sender_username?.trim() ||
          contact.sender_name?.trim() ||
          contact.username?.trim();
        const displayName =
          rawName && !/^\d{10,}$/.test(rawName)
            ? rawName
            : contact.sender_id
            ? `User ${contact.sender_id.slice(-4)}`
            : "Instagram User";

        return {
          id: contact.id,
          sender_id: contact.sender_id ?? null,
          sender_name: contact.sender_name ?? null,
          sender_username: contact.sender_username ?? null,
          sender_avatar_url: contact.sender_avatar_url ?? null,
          username: displayName,
          tags: contact.tags ?? [],
          last_interaction_at: contact.last_interaction_at,
        };
      });
    }
  } catch (error) {
    console.error("Live Inbox contacts could not be loaded; rendering an empty list.", error);
  }

  const firstContact = initialContacts[0];
  let initialMessages: Message[] = [];

  if (firstContact) {
    try {
      // 1. Try querying messages table
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, conversation_id, instagram_message_id, sender_id, message_text, media_url, media_type, is_from_user, created_at")
        .eq("conversation_id", firstContact.id)
        .order("created_at", { ascending: true });

      if (!messagesError && Array.isArray(messagesData) && messagesData.length > 0) {
        initialMessages = messagesData.map((message) => {
          const raw = message.message_text ?? "";
          const cleanBody =
            raw && raw !== "[Instagram message]"
              ? raw
              : message.media_url
              ? ""
              : !message.is_from_user
              ? "Message sent via Instagram"
              : "[Photo/Media]";

          return {
            id: message.id,
            contact_id: firstContact.id,
            conversation_id: message.conversation_id,
            instagram_message_id: message.instagram_message_id,
            direction: message.is_from_user ? "inbound" : "outbound",
            message_body: cleanBody,
            message_text: message.message_text,
            media_url: message.media_url,
            media_type: message.media_type,
            sender_id: message.sender_id,
            is_from_user: message.is_from_user,
            created_at: message.created_at,
          };
        });
      } else {
        // 2. Fallback to conversations table
        const { data: messages, error: fallbackError } = await supabase
          .from("conversations")
          .select("id, contact_id, direction, message_body, message_text, media_url, media_type, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, created_at")
          .or(`contact_id.eq.${firstContact.id},id.eq.${firstContact.id}`)
          .order("created_at", { ascending: true });
        if (fallbackError) throw fallbackError;

        initialMessages = (messages ?? []).map((message) => {
          const raw = message.message_text ?? message.message_body ?? "";
          const cleanBody =
            raw && raw !== "[Instagram message]"
              ? raw
              : message.media_url
              ? ""
              : message.direction === "outbound"
              ? "Message sent via Instagram"
              : "[Photo/Media]";

          return {
            ...message,
            direction: message.direction === "outbound" ? "outbound" : "inbound",
            message_body: cleanBody,
          };
        });
      }
    } catch (error) {
      console.error("Live Inbox messages could not be loaded.", error);
    }
  }

  return (
    <LiveInboxClient
      initialContacts={initialContacts}
      initialMessages={initialMessages}
      workspaceId={workspaceId}
    />
  );
}
