import { redirect } from "next/navigation";
import type { ConnectedAccount, Conversation, Message } from "@/types/inbox";
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

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at")
      .order("last_interaction_at", { ascending: false, nullsFirst: false });
    if (contactsError) throw contactsError;

    initialContacts = (contacts ?? []).map((contact) => ({
      id: contact.id,
      sender_id: contact.sender_id ?? null,
      sender_name: contact.sender_name ?? null,
      sender_username: contact.sender_username ?? null,
      sender_avatar_url: contact.sender_avatar_url ?? null,
      username:
        contact.sender_name ??
        contact.sender_username ??
        contact.username ??
        contact.sender_id ??
        "Unknown User",
      tags: contact.tags ?? [],
      last_interaction_at: contact.last_interaction_at,
    }));
  } catch (error) {
    console.error("Live Inbox contacts could not be loaded; rendering an empty list.", error);
  }

  let accounts: ConnectedAccount[] = [];
  try {
    const { data, error } = await supabase
      .from("ig_accounts")
      .select("id, is_webhook_subscribed")
      .eq("is_active", true);
    if (error) throw error;
    accounts = data ?? [];
  } catch (error) {
    console.error("Live Inbox webhook subscription status could not be loaded.", error);
  }
  const accountsNeedingSubscription = (accounts ?? [])
    .filter((account) => !(account.is_webhook_subscribed ?? true))
    .map((account) => account.id);

  const firstContact = initialContacts[0];
  let initialMessages: Message[] = [];

  if (firstContact) {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from("conversations")
        .select("id, contact_id, direction, message_body, message_text, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, created_at")
        .eq("contact_id", firstContact.id)
        .order("created_at", { ascending: true });
      if (messagesError) throw messagesError;

      initialMessages = (messages ?? []).map((message) => ({
        ...message,
        direction: message.direction === "outbound" ? "outbound" : "inbound",
        message_body: message.message_text ?? message.message_body ?? "",
      }));
    } catch (error) {
      console.error("Live Inbox messages could not be loaded.", error);
    }
  }

  return (
    <LiveInboxClient
      initialContacts={initialContacts}
      initialMessages={initialMessages}
      accountsNeedingSubscription={accountsNeedingSubscription}
      workspaceId={workspaceId}
    />
  );
}
