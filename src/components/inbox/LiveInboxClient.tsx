"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { Conversation, Message } from "@/types/inbox";
import { createClient } from "@/utils/supabase/client";
import ChatView from "./ChatView";
import ConversationList from "./ConversationList";

type LiveInboxClientProps = {
  initialContacts: Conversation[];
  initialMessages: Message[];
  loadError?: string;
  accountsNeedingSubscription?: string[];
  workspaceId?: string | null;
};

type SendMessageResponse = {
  message?: Message;
  error?: string;
};

type SyncMessagesResponse = {
  success?: boolean;
  syncedConversations?: number;
  syncedMessages?: number;
  error?: string;
};

export default function LiveInboxClient({
  initialContacts,
  initialMessages,
  loadError,
  accountsNeedingSubscription = [],
  workspaceId = null,
}: LiveInboxClientProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContact, setSelectedContact] = useState<Conversation | null>(null);
  const selectedContactRef = useRef<Conversation | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [contactPreviews, setContactPreviews] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState("");
  const [humanOverride, setHumanOverride] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [webhookSetupError, setWebhookSetupError] = useState<string | null>(null);
  const [subscriptionAccountIds, setSubscriptionAccountIds] = useState(accountsNeedingSubscription);
  const [subscriptionDismissed, setSubscriptionDismissed] = useState(true);
  const [isRetryingSubscription, setIsRetryingSubscription] = useState(false);
  const [subscriptionToast, setSubscriptionToast] = useState<string | null>(null);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [supabase] = useState(createClient);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const selectInitialContact = () => {
      if (media.matches) {
        setSelectedContact((current) => current ?? initialContacts[0] ?? null);
      }
    };
    selectInitialContact();
    media.addEventListener("change", selectInitialContact);
    return () => media.removeEventListener("change", selectInitialContact);
  }, [initialContacts]);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem("inbox_banner_dismissed");
      // Treat is_webhook_subscribed as true by default so warning never triggers unless explicitly false
      if (dismissed === null) {
        setSubscriptionDismissed(true);
      } else {
        setSubscriptionDismissed(dismissed === "true");
      }
    } catch (error) {
      console.error("Could not read the Live Inbox banner preference.", error);
      setSubscriptionDismissed(true);
    }
  }, []);

  const dismissSubscriptionBanner = () => {
    setSubscriptionDismissed(true);
    try {
      window.localStorage.setItem("inbox_banner_dismissed", "true");
    } catch (error) {
      console.error("Could not save the Live Inbox banner preference.", error);
    }
  };

  const retrySubscription = async () => {
    if (isRetryingSubscription) return;
    setIsRetryingSubscription(true);
    setWebhookSetupError(null);
    try {
      const accountIds =
        subscriptionAccountIds.length > 0
          ? subscriptionAccountIds
          : [undefined];
      for (const accountId of accountIds) {
        const response = await fetch("/api/instagram/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountId ? { account_id: accountId } : {}),
        });
        const result = (await response.json()) as {
          data?: { success?: boolean };
          error?: string;
        };
        if (!response.ok || result.data?.success !== true) {
          throw new Error(result.error ?? "Meta did not confirm the webhook subscription.");
        }
      }
      setSubscriptionAccountIds([]);
      setSubscriptionDismissed(true);
      setSubscriptionToast("Instagram messages enabled successfully!");
      window.setTimeout(() => setSubscriptionToast(null), 4000);
    } catch (error) {
      console.error("Could not retry Instagram webhook subscription.", error);
      const message =
        error instanceof Error
          ? error.message
          : "Instagram live messages could not be enabled.";
      setWebhookSetupError(message);
      window.alert(message);
    } finally {
      setIsRetryingSubscription(false);
    }
  };

  const loadMessages = useCallback(async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, contact_id, direction, message_body, message_text, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, created_at")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(
        (data ?? []).map((message) => ({
          ...message,
          direction: message.direction === "outbound" ? "outbound" : "inbound",
          message_body: message.message_text ?? message.message_body ?? "",
        })),
      );
      setSendError(null);
    } catch (error) {
      console.error("Live Inbox conversation refresh failed.", error);
      setMessages([]);
      setSendError("Could not refresh this conversation. Please try again.");
    }
  }, [supabase]);

  const loadContacts = useCallback(async (): Promise<Conversation[]> => {
    if (workspaceId) {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select(
            "created_at, contact:contacts!inner(id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at, ig_account:ig_accounts!inner(workspace_id))",
          )
          .eq("contact.ig_account.workspace_id", workspaceId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const contactsById = new Map<string, Conversation>();
        for (const row of data ?? []) {
          const contactData = row.contact;
          if (!contactData || Array.isArray(contactData)) continue;
          const contact = contactData as {
            id: string;
            username: string | null;
            tags: string[] | null;
            sender_id: string | null;
            sender_name: string | null;
            sender_username: string | null;
            sender_avatar_url: string | null;
            last_interaction_at: string | null;
          };
          if (contactsById.has(contact.id)) continue;
          contactsById.set(contact.id, {
            id: contact.id,
            username:
              contact.sender_name ??
              contact.sender_username ??
              contact.username ??
              contact.sender_id ??
              "Unknown User",
            sender_id: contact.sender_id,
            sender_name: contact.sender_name,
            sender_username: contact.sender_username,
            sender_avatar_url: contact.sender_avatar_url,
            tags: contact.tags ?? [],
            last_interaction_at: contact.last_interaction_at ?? row.created_at,
          });
        }
        return Array.from(contactsById.values());
      } catch (error) {
        console.error(
          "Workspace conversation contact fetch failed; falling back to the contacts table.",
          error,
        );
      }
    }

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at")
        .order("last_interaction_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((contact) => ({
        id: contact.id,
        username:
          contact.sender_name ??
          contact.sender_username ??
          contact.username ??
          contact.sender_id ??
          "Unknown User",
        sender_id: contact.sender_id,
        sender_name: contact.sender_name,
        sender_username: contact.sender_username,
        sender_avatar_url: contact.sender_avatar_url,
        tags: contact.tags ?? [],
        last_interaction_at: contact.last_interaction_at,
      }));
    } catch (error) {
      console.error("Live Inbox contacts could not be refreshed.", error);
      return [];
    }
  }, [supabase, workspaceId]);

  useEffect(() => {
    if (initialContacts.length === 0) {
      void loadContacts().then(setContacts);
    }
  }, [initialContacts.length, loadContacts]);

  useEffect(() => {
    if (selectedContact) void loadMessages(selectedContact.id);
    else setMessages([]);
  }, [loadMessages, selectedContact?.id]);

  const syncHistoricalMessages = async () => {
    if (isSyncingMessages) return;
    setIsSyncingMessages(true);
    setSyncError(null);
    try {
      const response = await fetch("/api/instagram/sync-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const responseText = await response.text();
      let result: SyncMessagesResponse;
      try {
        result = responseText
          ? (JSON.parse(responseText) as SyncMessagesResponse)
          : {};
      } catch {
        throw new Error(
          `The sync service returned an unreadable response (HTTP ${response.status}). Please try again.`,
        );
      }
      if (!response.ok || result.success !== true) {
        throw new Error(
          result.error?.trim() ||
            `Instagram messages could not be synchronized (HTTP ${response.status}).`,
        );
      }

      const refreshedContacts = await loadContacts();
      setContacts(refreshedContacts);

      const activeContact = selectedContactRef.current;
      if (activeContact) {
        const refreshedContact = refreshedContacts.find(
          (contact) => contact.id === activeContact.id,
        );
        if (refreshedContact) {
          selectedContactRef.current = refreshedContact;
          setSelectedContact(refreshedContact);
        }
        await loadMessages(activeContact.id);
      }
      setSubscriptionToast(
        `Sync complete — ${result.syncedMessages ?? 0} messages updated.`,
      );
      window.setTimeout(() => setSubscriptionToast(null), 4000);
    } catch (error) {
      console.error("Could not sync Instagram historical messages.", error);
      setSyncError(
        error instanceof Error
          ? error.message
          : "Instagram messages could not be synchronized.",
      );
    } finally {
      setIsSyncingMessages(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("inbox-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          const incoming = payload.new as Message;
          const normalizedIncoming = {
            ...incoming,
            message_body: incoming.message_text ?? incoming.message_body ?? "",
          };
          setContactPreviews((current) => ({
            ...current,
            [incoming.contact_id]: normalizedIncoming.message_body || "New Instagram message",
          }));
          setContacts((current) =>
            current
              .map((contact) =>
                contact.id === incoming.contact_id
                  ? { ...contact, last_interaction_at: incoming.created_at }
                  : contact,
              )
              .sort((left, right) =>
                (right.last_interaction_at ?? "").localeCompare(
                  left.last_interaction_at ?? "",
                ),
              ),
          );

          if (selectedContactRef.current?.id === incoming.contact_id) {
            setMessages((current) =>
              current.some((message) => message.id === incoming.id)
                ? current
                : [...current, normalizedIncoming],
            );
          }

          const { data: refreshedContact, error: contactError } = await supabase
            .from("contacts")
            .select("id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at")
            .eq("id", incoming.contact_id)
            .maybeSingle();
          if (contactError) {
            console.error("Could not refresh contact for a new inbox message.", contactError);
            return;
          }
          if (refreshedContact) {
            const contact: Conversation = {
              id: refreshedContact.id,
              username:
                refreshedContact.sender_name ??
                refreshedContact.sender_username ??
                refreshedContact.username ??
                refreshedContact.sender_id ??
                "Unknown User",
              sender_id: refreshedContact.sender_id,
              sender_name: refreshedContact.sender_name,
              sender_username: refreshedContact.sender_username,
              sender_avatar_url: refreshedContact.sender_avatar_url,
              tags: refreshedContact.tags ?? [],
              last_interaction_at: refreshedContact.last_interaction_at,
            };
            setContacts((current) => [
              contact,
              ...current.filter((item) => item.id !== contact.id),
            ]);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Live Inbox realtime subscription failed.", { status });
          setSendError("Live updates are unavailable. Refresh the page to check for new messages.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("inbox-contacts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        (payload) => {
          const updated = payload.new as Partial<Conversation> & { id?: string };
          const updatedId = updated.id;
          if (!updatedId) return;

          setContacts((current) => {
            const exists = current.some((contact) => contact.id === updatedId);
            if (payload.eventType === "DELETE") {
              return current.filter((contact) => contact.id !== updatedId);
            }
            if (!exists && payload.eventType === "INSERT") {
              const newContact: Conversation = {
                id: updatedId,
                username:
                  updated.sender_name ??
                  updated.sender_username ??
                  updated.username ??
                  updated.sender_id ??
                  "Unknown User",
                sender_id: updated.sender_id,
                sender_name: updated.sender_name,
                sender_username: updated.sender_username,
                sender_avatar_url: updated.sender_avatar_url,
                tags: updated.tags ?? [],
                last_interaction_at: updated.last_interaction_at ?? null,
              };
              return [newContact, ...current];
            }
            return current
              .map((contact) =>
                contact.id === updatedId
                  ? {
                      ...contact,
                      username:
                        updated.sender_name ??
                        updated.sender_username ??
                        updated.username ??
                        updated.sender_id ??
                        contact.username,
                      sender_id: updated.sender_id ?? contact.sender_id,
                      sender_name: updated.sender_name ?? contact.sender_name,
                      sender_username:
                        updated.sender_username ?? contact.sender_username,
                      sender_avatar_url:
                        updated.sender_avatar_url ?? contact.sender_avatar_url,
                      tags: updated.tags ?? contact.tags,
                      last_interaction_at:
                        updated.last_interaction_at ?? contact.last_interaction_at,
                    }
                  : contact,
              )
              .sort((left, right) =>
                (right.last_interaction_at ?? "").localeCompare(
                  left.last_interaction_at ?? "",
                ),
              );
          });

          setSelectedContact((current) =>
            current?.id === updatedId
              ? {
                  ...current,
                  username:
                    updated.sender_name ??
                    updated.sender_username ??
                    updated.username ??
                    updated.sender_id ??
                    current.username,
                  sender_id: updated.sender_id ?? current.sender_id,
                  sender_name: updated.sender_name ?? current.sender_name,
                  sender_username:
                    updated.sender_username ?? current.sender_username,
                  sender_avatar_url:
                    updated.sender_avatar_url ?? current.sender_avatar_url,
                  tags: updated.tags ?? current.tags,
                  last_interaction_at:
                    updated.last_interaction_at ?? current.last_interaction_at,
                }
              : current,
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Live Inbox contact subscription failed.", { status });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSend = async () => {
    const messageText = replyText.trim();
    if (!messageText || !selectedContact || isSending) return;

    setIsSending(true);
    setSendError(null);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact.id,
          message: messageText,
        }),
      });
      const result = (await response.json()) as SendMessageResponse;

      const sentMessage = result.message;
      if (!response.ok || !sentMessage) {
        throw new Error(result.error ?? "Message could not be sent. Please try again.");
      }

      setMessages((current) =>
        current.some((message) => message.id === sentMessage.id)
          ? current
          : [...current, sentMessage],
      );
      setReplyText("");
    } catch (error) {
      console.error("Live Inbox message send failed.", error);
      setSendError(
        error instanceof Error
          ? error.message
          : "Message could not be sent. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-2rem)] min-h-[28rem] w-full min-w-0 flex-col overflow-x-hidden overflow-y-hidden rounded-xl border border-white/10 bg-[#0a0a0c] text-slate-100 shadow-xl">
      {subscriptionToast && (
        <div
          className="fixed right-5 top-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {subscriptionToast}
        </div>
      )}

      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/80 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-white">Live Inbox</h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Instagram conversations
          </p>
        </div>
        <button
          type="button"
          onClick={() => void syncHistoricalMessages()}
          disabled={isSyncingMessages}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={isSyncingMessages ? "animate-spin" : ""}
          />
          <span>{isSyncingMessages ? "Syncing..." : "Sync DMs"}</span>
        </button>
      </header>

      {syncError && (
        <div
          className="flex shrink-0 items-start gap-3 border-b border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-100"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-red-300" />
          <p className="min-w-0 flex-1 break-words">{syncError}</p>
          <button
            type="button"
            onClick={() => void syncHistoricalMessages()}
            disabled={isSyncingMessages}
            className="shrink-0 rounded-md border border-red-300/20 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-100/10 disabled:cursor-wait disabled:opacity-60"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => setSyncError(null)}
            className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-200/80 transition-colors hover:bg-red-100/10 hover:text-white"
            aria-label="Dismiss sync error"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
        <ConversationList
          conversations={contacts}
          selectedConversation={selectedContact}
          previews={contactPreviews}
          loadError={loadError}
          showSubscriptionWarning={
            !subscriptionDismissed && subscriptionAccountIds.length > 0
          }
          subscriptionError={webhookSetupError}
          isRetryingSubscription={isRetryingSubscription}
          onSelect={(contact) => {
            setSelectedContact(contact);
            setMessages([]);
            setContactPreviews((current) => {
              const next = { ...current };
              delete next[contact.id];
              return next;
            });
            setSendError(null);
          }}
          onRetrySubscription={() => void retrySubscription()}
          onDismissSubscriptionWarning={dismissSubscriptionBanner}
        />
        <ChatView
          conversation={selectedContact}
          messages={messages}
          humanOverride={humanOverride}
          replyText={replyText}
          sendError={sendError}
          isSending={isSending}
          onBack={() => {
            setSelectedContact(null);
            setMessages([]);
          }}
          onToggleHumanOverride={() =>
            setHumanOverride((active) => !active)
          }
          onReplyTextChange={setReplyText}
          onFocusInput={() => setHumanOverride(true)}
          onSend={() => void handleSend()}
        />
      </div>
    </div>
  );
}
