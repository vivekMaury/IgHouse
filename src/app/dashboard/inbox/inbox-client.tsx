"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Clock, MessageSquare, Send, User, UserRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export type Contact = {
  id: string;
  username: string;
  tags: string[];
  last_interaction_at: string | null;
};

export type Message = {
  id: string;
  contact_id: string;
  direction: "inbound" | "outbound";
  message_body: string;
  created_at: string;
};

type InboxClientProps = {
  initialContacts: Contact[];
  initialMessages: Message[];
  loadError?: string;
};

type SendMessageResponse = {
  message?: Message;
  error?: string;
};

export default function InboxClient({
  initialContacts,
  initialMessages,
  loadError,
}: InboxClientProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    initialContacts[0] ?? null,
  );
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [humanOverride, setHumanOverride] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMessages = useCallback(async (contactId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, contact_id, direction, message_body, created_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Live Inbox conversation refresh failed.", error);
      setSendError("Could not refresh this conversation. Please try again.");
      return;
    }

    setMessages(
      (data ?? []).map((message) => ({
        ...message,
        direction: message.direction === "outbound" ? "outbound" : "inbound",
        message_body: message.message_body ?? "",
      })),
    );
  }, [supabase]);

  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }

    const contactId = selectedContact.id;
    const channel = supabase
      .channel(`inbox-${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming],
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void loadMessages(contactId);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Live Inbox realtime subscription failed.", { status });
          setSendError("Live updates are unavailable. Refresh the page to check for new messages.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadMessages, selectedContact, supabase]);

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
                username: updated.username ?? "Unknown User",
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
                      username: updated.username ?? contact.username,
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
                  username: updated.username ?? current.username,
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
      const response = await fetch("/api/inbox/messages", {
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
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 bg-white p-5 text-lg font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          Live Inbox
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadError && (
            <p className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
              {loadError}
            </p>
          )}
          {contacts.map((contact) => (
            <button
              type="button"
              key={contact.id}
              onClick={() => {
                setSelectedContact(contact);
                setMessages([]);
                setSendError(null);
              }}
              className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-800/50 dark:hover:bg-slate-800 ${
                selectedContact?.id === contact.id
                  ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                <User size={20} className="text-slate-500" />
              </div>
              <div className="overflow-hidden">
                <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {contact.username || "Unknown User"}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {contact.last_interaction_at
                    ? new Date(contact.last_interaction_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )
                    : "Never"}
                </div>
              </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              No conversations yet. New Instagram messages will appear here.
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
        {selectedContact ? (
          <>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <User size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedContact.username || "Unknown User"}
                  </div>
                  <div className="mt-0.5 flex gap-1">
                    {selectedContact.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHumanOverride((active) => !active)}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                  humanOverride
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {humanOverride ? <UserRound size={16} /> : <Bot size={16} />}
                {humanOverride ? "Human Override" : "Bot Active"}
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-6 dark:bg-slate-950/30">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No messages yet.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === "outbound"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        message.direction === "outbound"
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {message.message_body}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {sendError && (
                <p className="mb-2 text-sm text-red-600" role="alert">
                  {sendError}
                </p>
              )}
              <form
                className="flex gap-2"
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
                  className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  aria-label="Message text"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"
                >
                  <Send size={18} />
                  <span className="sr-only">{isSending ? "Sending" : "Send"}</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700" />
            <p>Select a contact to view conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
