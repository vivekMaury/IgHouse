"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Clock,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  UserRound,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export type Contact = {
  id: string;
  username: string;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  tags: string[];
  last_interaction_at: string | null;
};

export type Message = {
  id: string;
  contact_id: string;
  direction: "inbound" | "outbound";
  message_body: string;
  message_text?: string | null;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  is_from_user?: boolean | null;
  created_at: string;
};

type InboxClientProps = {
  initialContacts: Contact[];
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

export default function InboxClient({
  initialContacts,
  initialMessages,
  loadError,
  accountsNeedingSubscription = [],
  workspaceId = null,
}: InboxClientProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      setSubscriptionDismissed(
        window.localStorage.getItem("inbox_banner_dismissed") === "true",
      );
    } catch (error) {
      console.error("Could not read the Live Inbox banner preference.", error);
      setSubscriptionDismissed(false);
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

  const loadContacts = useCallback(async (): Promise<Contact[]> => {
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

        const contactsById = new Map<string, Contact>();
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
  }, [loadMessages, selectedContact]);

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
      const result = (await response.json()) as SyncMessagesResponse;
      if (!response.ok || result.success !== true) {
        throw new Error(result.error ?? "Instagram messages could not be synchronized.");
      }

      setContacts(await loadContacts());

      const activeContact = selectedContactRef.current;
      if (activeContact) {
        await loadMessages(activeContact.id);
      }
      setSubscriptionToast(
        `Synced ${result.syncedMessages ?? 0} Instagram messages.`,
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
            const contact: Contact = {
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
          const updated = payload.new as Partial<Contact> & { id?: string };
          const updatedId = updated.id;
          if (!updatedId) return;

          setContacts((current) => {
            const exists = current.some((contact) => contact.id === updatedId);
            if (payload.eventType === "DELETE") {
              return current.filter((contact) => contact.id !== updatedId);
            }
            if (!exists && payload.eventType === "INSERT") {
              const newContact: Contact = {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <p className="shrink-0 border-b border-red-900/60 bg-red-950/50 px-4 py-2 text-sm text-red-200" role="alert">
          {syncError}
        </p>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
        <aside
          className={`${
            selectedContact ? "hidden md:flex" : "flex"
          } min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-950/70 md:col-span-4 lg:col-span-3`}
        >
          {loadError && (
            <p className="m-3 rounded-lg border border-red-900/60 bg-red-950/50 p-3 text-sm text-red-200" role="alert">
              {loadError}
            </p>
          )}
          {!subscriptionDismissed && subscriptionAccountIds.length > 0 && (
            <div className="m-3 rounded-lg border border-amber-700/40 bg-amber-950/40 p-3 text-sm text-amber-100" role="status">
              <div className="flex items-start gap-2">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>
                    {webhookSetupError ??
                      "Instagram message events are not enabled. You can still view existing conversations."}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void retrySubscription()}
                      disabled={isRetryingSubscription}
                      className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isRetryingSubscription && (
                        <LoaderCircle size={14} className="animate-spin" />
                      )}
                      Retry Subscription
                    </button>
                    <button
                      type="button"
                      onClick={dismissSubscriptionBanner}
                      className="text-xs font-medium text-amber-200 hover:text-white hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <button
                type="button"
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setMessages([]);
                  setContactPreviews((current) => {
                    const next = { ...current };
                    delete next[contact.id];
                    return next;
                  });
                  setSendError(null);
                }}
                className={`flex w-full min-w-0 items-center gap-3 border-b border-white/[0.06] px-4 py-4 text-left transition-colors hover:bg-white/[0.06] ${
                  selectedContact?.id === contact.id
                    ? "border-l-2 border-l-blue-500 bg-blue-500/10"
                    : "border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  {contact.sender_avatar_url ? (
                    <img
                      src={contact.sender_avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-100">
                    {contact.username || "Unknown User"}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {contact.last_interaction_at
                      ? new Date(contact.last_interaction_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : "Never"}
                  </div>
                  {contactPreviews[contact.id] && (
                    <div className="mt-1 truncate text-xs text-blue-300">
                      {contactPreviews[contact.id]}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {contacts.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">
                No conversations yet. Sync DMs or wait for new Instagram messages.
              </div>
            )}
          </div>
        </aside>

        <section
          className={`${
            selectedContact ? "flex" : "hidden md:flex"
          } min-h-0 min-w-0 flex-col overflow-hidden bg-[#0a0a0c] md:col-span-8 lg:col-span-9`}
        >
          {selectedContact ? (
            <>
              <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/60 px-3 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContact(null);
                      setMessages([]);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
                    aria-label="Back to Inbox"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Inbox</span>
                  </button>
                  <div className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 sm:flex">
                    {selectedContact.sender_avatar_url ? (
                      <img
                        src={selectedContact.sender_avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={17} className="text-slate-300" />
                    )}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <div className="truncate font-semibold text-white">
                      {selectedContact.sender_name ||
                        selectedContact.sender_username ||
                        selectedContact.sender_id ||
                        selectedContact.username ||
                        "Instagram User"}
                    </div>
                    <div className="mt-1 flex gap-1">
                      {selectedContact.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="truncate font-semibold text-white sm:hidden">
                    {selectedContact.sender_name ||
                      selectedContact.sender_username ||
                      selectedContact.sender_id ||
                      selectedContact.username ||
                      "Instagram User"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHumanOverride((active) => !active)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                    humanOverride
                      ? "border-amber-700/50 bg-amber-900/30 text-amber-200"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {humanOverride ? <UserRound size={16} /> : <Bot size={16} />}
                  <span className="hidden sm:inline">
                    {humanOverride ? "Human Override" : "Bot Active"}
                  </span>
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-black/20 p-3 sm:p-6">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex min-w-0 ${
                        message.direction === "outbound"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                          message.direction === "outbound"
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm border border-white/10 bg-zinc-900 text-slate-100"
                        }`}
                      >
                        {message.message_text ?? message.message_body}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-white/10 bg-zinc-950/70 p-3 sm:p-4">
                {sendError && (
                  <p className="mb-2 text-sm text-red-300" role="alert">
                    {sendError}
                  </p>
                )}
                <form
                  className="flex min-w-0 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    onFocus={() => setHumanOverride(true)}
                    placeholder="Type an Instagram message..."
                    maxLength={1000}
                    disabled={isSending}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
                    aria-label="Message text"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-50 sm:px-5"
                    aria-label={isSending ? "Sending message" : "Send message"}
                  >
                    {isSending ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    <span className="hidden sm:inline">
                      {isSending ? "Sending" : "Send"}
                    </span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <MessageSquare size={48} className="text-slate-600" />
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
