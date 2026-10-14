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
  const [statusToast, setStatusToast] = useState<string | null>(null);
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

  const loadMessages = useCallback(async (conversationIdOrContactId: string) => {
    if (!conversationIdOrContactId) return;

    try {
      // 1. Ensure the conversation ID being passed matches the UUID primary key of the conversations table
      let resolvedConversationId = conversationIdOrContactId;

      // Check if conversationIdOrContactId needs resolution (e.g. was a legacy contact_id)
      const { data: convRecord, error: convLookupError } = await supabase
        .from("conversations")
        .select("id")
        .or(`id.eq.${conversationIdOrContactId},contact_id.eq.${conversationIdOrContactId}`)
        .limit(1)
        .maybeSingle();

      if (convLookupError) {
        console.error("Supabase conversation lookup error in LiveInboxClient:", {
          message: convLookupError.message,
          details: convLookupError.details,
          hint: convLookupError.hint,
          code: convLookupError.code,
          input: conversationIdOrContactId,
        });
      } else if (convRecord?.id) {
        resolvedConversationId = convRecord.id;
      }

      // 2. Fetch messages using the correct table name `messages` and foreign key `conversation_id`
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", resolvedConversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Supabase messages query error in LiveInboxClient:", {
          message: messagesError.message,
          details: messagesError.details,
          hint: messagesError.hint,
          code: messagesError.code,
          conversation_id: resolvedConversationId,
        });
        setMessages([]);
        return;
      }

      if (Array.isArray(messagesData) && messagesData.length > 0) {
        setMessages(
          messagesData.map((message) => {
            const raw = message.message_text ?? "";
            const isBlankOrPlaceholder =
              !raw ||
              raw === "[Instagram message]" ||
              raw === "[Photo/Media]" ||
              raw === "[Photo]" ||
              raw === "[Media]" ||
              raw === "[Video]" ||
              raw === "[Sticker]";

            const cleanBody = !isBlankOrPlaceholder
              ? raw
              : message.media_url
              ? ""
              : message.is_from_user
              ? "Message sent via Instagram"
              : "[Photo/Media]";

            return {
              id: message.id,
              contact_id: resolvedConversationId,
              conversation_id: message.conversation_id,
              instagram_message_id: message.instagram_message_id,
              direction: message.is_from_user ? "outbound" : "inbound",
              message_body: cleanBody,
              message_text: message.message_text,
              media_url: message.media_url,
              media_type: message.media_type,
              sender_id: message.sender_id,
              is_from_user: message.is_from_user,
              created_at: message.created_at,
            };
          }),
        );
        setSendError(null);
        return;
      }

      // 3. Fallback for conversations table (seamless backward compatibility)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("conversations")
        .select("id, contact_id, direction, message_body, sender_id, sender_name, sender_username, sender_avatar_url, is_from_user, metadata, created_at")
        .or(`contact_id.eq.${resolvedConversationId},id.eq.${resolvedConversationId}`)
        .order("created_at", { ascending: true });

      if (fallbackError) {
        console.warn("Supabase legacy conversation query in LiveInboxClient:", {
          message: fallbackError.message,
          code: fallbackError.code,
          conversation_id: resolvedConversationId,
        });
        setMessages([]);
        return;
      }

      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        setMessages(
          fallbackData.map((message) => {
            const raw = (message as any).message_text ?? message.message_body ?? "";
            const metaText =
              message.metadata && typeof message.metadata === "object"
                ? (message.metadata as Record<string, unknown>).text ??
                  (message.metadata as Record<string, unknown>).raw_message
                : null;
            const cleanBody =
              raw && raw !== "[Instagram message]"
                ? raw
                : typeof metaText === "string" && metaText && metaText !== "[Instagram message]"
                ? metaText
                : (message as any).media_url
                ? ""
                : message.direction === "outbound"
                ? "Message sent via Instagram"
                : "[Photo/Media]";

            return {
              ...message,
              direction: message.direction === "outbound" ? "outbound" : "inbound",
              message_body: cleanBody,
              media_url: (message as any).media_url ?? null,
              media_type: (message as any).media_type ?? null,
            };
          }),
        );
      } else {
        setMessages([]);
      }
      setSendError(null);
    } catch (error) {
      console.error("Unexpected error loading messages for conversation in LiveInboxClient:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        conversationId: conversationIdOrContactId,
      });
      setMessages([]);
    }
  }, [supabase]);

  const loadContacts = useCallback(async (): Promise<Conversation[]> => {
    // 1. Primary: load from conversations table
    try {
      let convQuery = supabase
        .from("conversations")
        .select("id, workspace_id, instagram_conversation_id, sender_id, sender_name, sender_username, sender_avatar_url, last_message, updated_at, created_at")
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (workspaceId) {
        convQuery = convQuery.eq("workspace_id", workspaceId);
      }

      const { data: convData, error: convError } = await convQuery;
      if (!convError && Array.isArray(convData) && convData.length > 0) {
        return convData.map((conv) => {
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
            username: displayName,
            sender_id: conv.sender_id,
            sender_name: conv.sender_name,
            sender_username: conv.sender_username,
            sender_avatar_url: conv.sender_avatar_url,
            last_message: conv.last_message,
            media_url: (conv as any).media_url ?? null,
            media_type: (conv as any).media_type ?? null,
            tags: [],
            last_interaction_at: conv.updated_at || conv.created_at,
          };
        });
      }
    } catch (error) {
      console.warn("Could not query conversations table for contacts list.", error);
    }

    // 2. Secondary fallback: load from contacts table
    if (workspaceId) {
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(
            "id, username, tags, sender_id, sender_name, sender_username, sender_avatar_url, last_interaction_at, ig_account:ig_accounts!inner(workspace_id)",
          )
          .eq("ig_account.workspace_id", workspaceId)
          .order("last_interaction_at", { ascending: false, nullsFirst: false });
        if (error) throw error;

        if (Array.isArray(data) && data.length > 0) {
          return data.map((contact) => {
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
              username: displayName,
              sender_id: contact.sender_id,
              sender_name: contact.sender_name,
              sender_username: contact.sender_username,
              sender_avatar_url: contact.sender_avatar_url,
              tags: contact.tags ?? [],
              last_interaction_at: contact.last_interaction_at,
            };
          });
        }
      } catch (error) {
        console.error(
          "Workspace contact fetch failed; falling back to direct contacts query.",
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
      return (data ?? []).map((contact) => {
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
          username: displayName,
          sender_id: contact.sender_id,
          sender_name: contact.sender_name,
          sender_username: contact.sender_username,
          sender_avatar_url: contact.sender_avatar_url,
          tags: contact.tags ?? [],
          last_interaction_at: contact.last_interaction_at,
        };
      });
    } catch (error) {
      console.error("Live Inbox contacts could not be refreshed.", error);
      return initialContacts;
    }
  }, [initialContacts, supabase, workspaceId]);

  useEffect(() => {
    if (initialContacts.length === 0) {
      void loadContacts()
        .then(setContacts)
        .catch((error) => {
          console.error("Live Inbox contacts could not be refreshed.", error);
          setContacts(initialContacts);
        });
    }
  }, [initialContacts, loadContacts]);

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
      setStatusToast(
        `Sync complete — ${result.syncedMessages ?? 0} messages updated.`,
      );
      window.setTimeout(() => setStatusToast(null), 4000);
    } catch (error) {
      console.error("Could not sync Instagram historical messages.", error);
      const errMsg = error instanceof Error ? error.message : "Instagram messages could not be synchronized.";
      if (!errMsg.toLowerCase().includes("missing live inbox columns") && !errMsg.toLowerCase().includes("missing columns")) {
        setSyncError(errMsg);
      }
    } finally {
      setIsSyncingMessages(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          try {
            const incoming = payload.new as Message;
            if (!incoming.id || (!incoming.conversation_id && !incoming.contact_id)) return;
            const threadId = incoming.conversation_id || incoming.contact_id!;
            const rawText = incoming.message_text ?? incoming.message_body ?? "";
            const cleanText =
              rawText && rawText !== "[Instagram message]"
                ? rawText
                : incoming.media_url
                ? "📷 Photo"
                : !incoming.is_from_user
                ? "Message sent via Instagram"
                : "[Photo/Media]";

            const normalized: Message = {
              ...incoming,
              direction: incoming.is_from_user ? "outbound" : "inbound",
              message_body: cleanText,
            };

            setContactPreviews((prev) => ({
              ...prev,
              [threadId]: cleanText || "New Instagram message",
            }));

            if (selectedContactRef.current?.id === threadId) {
              setMessages((prev) =>
                prev.some((m) => m.id === incoming.id) ? prev : [...prev, normalized],
              );
            }
          } catch (err) {
            console.error("Could not process realtime messages event.", err);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          try {
            const incoming = payload.new as Message;
            if (!incoming.id || (!incoming.contact_id && !incoming.id)) return;
            const threadId = incoming.contact_id || incoming.id;

            const rawIncomingText = incoming.message_text ?? incoming.message_body ?? "";
            const cleanIncomingText =
              rawIncomingText && rawIncomingText !== "[Instagram message]"
                ? rawIncomingText
                : incoming.media_url
                ? "📷 Photo"
                : incoming.direction === "outbound"
                ? "Message sent via Instagram"
                : "[Photo/Media]";

            const normalizedIncoming = {
              ...incoming,
              message_body: cleanIncomingText,
            };
            setContactPreviews((current) => ({
              ...current,
              [threadId]:
                cleanIncomingText || "New Instagram message",
            }));

            if (selectedContactRef.current?.id === threadId) {
              setMessages((current) =>
                current.some((message) => message.id === incoming.id)
                  ? current
                  : [...current, normalizedIncoming],
              );
            }
          } catch (error) {
            console.error("Could not process a new Live Inbox conversation event.", error);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Live Inbox realtime subscription failed.", { status });
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
                  updated.sender_username ??
                  updated.username ??
                  updated.sender_name ??
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
                        updated.sender_username ??
                        updated.username ??
                        updated.sender_name ??
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
                    updated.sender_username ??
                    updated.username ??
                    updated.sender_name ??
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

  const onSendMessageSuccess = useCallback(async (conversationId: string) => {
    try {
      await loadMessages(conversationId);
      const refreshedContacts = await loadContacts();
      setContacts(refreshedContacts);
    } catch (err) {
      console.error("Error in onSendMessageSuccess handler:", err);
    }
  }, [loadMessages, loadContacts]);

  const handleSend = async () => {
    const messageText = replyText.trim();
    if (!messageText || !selectedContact || isSending) return;

    const activeConversationId = selectedContact.id;
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: activeConversationId,
      contact_id: activeConversationId,
      direction: "outbound",
      message_body: messageText,
      message_text: messageText,
      is_from_user: true,
      created_at: nowIso,
    };

    // 1. Optimistic UI update: Immediately append to local messages array
    setMessages((prev) => [...prev, optimisticMessage]);
    setReplyText("");
    setIsSending(true);
    setSendError(null);

    // Update conversation sidebar preview immediately
    setContactPreviews((prev) => ({
      ...prev,
      [activeConversationId]: messageText,
    }));

    try {
      const response = await fetch("/api/instagram/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          contactId: activeConversationId,
          message: messageText,
        }),
      });

      let result: SendMessageResponse;
      try {
        result = (await response.json()) as SendMessageResponse;
      } catch {
        throw new Error(`Invalid server response (HTTP ${response.status})`);
      }

      const sentMessage = result.message;
      if (!response.ok || !sentMessage) {
        throw new Error(result.error ?? "Message could not be sent. Please try again.");
      }

      // Reconcile optimistic message with persisted server message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimisticId ? sentMessage : msg)),
      );

      // 2. Explicit onSuccess state handler to trigger local re-fetching
      await onSendMessageSuccess(activeConversationId);
    } catch (error) {
      console.error("Live Inbox message send failed:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        conversationId: activeConversationId,
      });

      // Remove optimistic message on failure and restore input
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      setReplyText(messageText);
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
      {statusToast && (
        <div
          className="fixed right-5 top-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {statusToast}
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

      {syncError &&
        !syncError.toLowerCase().includes("missing live inbox columns") &&
        !syncError.toLowerCase().includes("missing columns") && (
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
