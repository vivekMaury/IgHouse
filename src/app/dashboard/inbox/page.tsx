import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InboxClient, { type Contact, type Message } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, username, tags, last_interaction_at")
    .order("last_interaction_at", { ascending: false, nullsFirst: false });

  if (contactsError) {
    console.error("Live Inbox contacts could not be loaded.", contactsError);
    return (
      <InboxClient
        initialContacts={[]}
        initialMessages={[]}
        loadError="Could not load inbox contacts. Please refresh the page."
        subscriptionStatusUnavailable={false}
      />
    );
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("ig_accounts")
    .select("id, is_webhook_subscribed")
    .eq("is_active", true);
  if (accountsError) {
    console.error("Live Inbox webhook subscription status could not be loaded.", accountsError);
  }
  const accountsNeedingSubscription = (accounts ?? [])
    .filter((account) => !account.is_webhook_subscribed)
    .map((account) => account.id);

  const initialContacts: Contact[] = (contacts ?? []).map((contact) => ({
    id: contact.id,
    username: contact.username ?? "Unknown User",
    tags: contact.tags ?? [],
    last_interaction_at: contact.last_interaction_at,
  }));
  const firstContact = initialContacts[0];
  let initialMessages: Message[] = [];

  if (firstContact) {
    const { data: messages, error: messagesError } = await supabase
      .from("conversations")
      .select("id, contact_id, direction, message_body, created_at")
      .eq("contact_id", firstContact.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Live Inbox messages could not be loaded.", messagesError);
      return (
        <InboxClient
          initialContacts={initialContacts}
          initialMessages={[]}
          loadError="Could not load this conversation. Please refresh the page."
          accountsNeedingSubscription={accountsNeedingSubscription}
          subscriptionStatusUnavailable={Boolean(accountsError)}
        />
      );
    }

    initialMessages = (messages ?? []).map((message) => ({
      ...message,
      direction: message.direction === "outbound" ? "outbound" : "inbound",
      message_body: message.message_body ?? "",
    }));
  }

  return (
    <InboxClient
      initialContacts={initialContacts}
      initialMessages={initialMessages}
      accountsNeedingSubscription={accountsNeedingSubscription}
      subscriptionStatusUnavailable={Boolean(accountsError)}
    />
  );
}
