"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, ExternalLink, MessageSquare, User, UserRound, X } from "lucide-react";
import type { Conversation, Message } from "@/types/inbox";
import MessageInput from "./MessageInput";

type ChatViewProps = {
  conversation: Conversation | null;
  messages: Message[];
  humanOverride: boolean;
  replyText: string;
  sendError: string | null;
  isSending: boolean;
  onBack: () => void;
  onToggleHumanOverride: () => void;
  onReplyTextChange: (value: string) => void;
  onFocusInput: () => void;
  onSend: () => void;
};

function getInitials(name?: string | null): string {
  if (!name) return "";
  const clean = name.replace(/^@/, "").trim();
  if (!clean || /^\d{10,}$/.test(clean)) return "";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function ChatView({
  conversation,
  messages,
  humanOverride,
  replyText,
  sendError,
  isSending,
  onBack,
  onToggleHumanOverride,
  onReplyTextChange,
  onFocusInput,
  onSend,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type?: string | null;
  } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const contactName = conversation
    ? conversation.sender_username && !/^\d{10,}$/.test(conversation.sender_username)
      ? `@${conversation.sender_username.replace(/^@/, "")}`
      : conversation.sender_name && !/^\d{10,}$/.test(conversation.sender_name)
      ? conversation.sender_name
      : conversation.username && !/^\d{10,}$/.test(conversation.username)
      ? `@${conversation.username.replace(/^@/, "")}`
      : conversation.sender_id
      ? `User ${conversation.sender_id.slice(-4)}`
      : "Instagram User"
    : "Instagram User";

  const contactInitials = conversation
    ? getInitials(conversation.sender_name || conversation.sender_username || conversation.username)
    : "";

  return (
    <section
      className={`${
        conversation ? "flex" : "hidden md:flex"
      } min-h-0 min-w-0 flex-col overflow-hidden bg-[#0a0a0c] md:col-span-8 lg:col-span-9`}
    >
      {conversation ? (
        <>
          <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/60 px-3 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Back to Inbox"
              >
                <ArrowLeft size={18} />
                <span>Back to Inbox</span>
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-inner sm:flex">
                {conversation.sender_avatar_url ? (
                  <img
                    src={conversation.sender_avatar_url}
                    alt={contactName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : contactInitials ? (
                  <span>{contactInitials}</span>
                ) : (
                  <User size={17} className="text-slate-200" />
                )}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate font-semibold text-white">
                  {contactName}
                </div>
                {conversation.sender_name &&
                  conversation.sender_username &&
                  conversation.sender_name !== conversation.sender_username && (
                    <div className="truncate text-xs text-slate-400">
                      {conversation.sender_name}
                    </div>
                  )}
                <div className="mt-1 flex gap-1">
                  {conversation.tags?.map((tag) => (
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
                {contactName}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleHumanOverride}
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
              messages.map((message) => {
                const rawText = message.message_text ?? message.message_body ?? "";
                const isPlaceholder =
                  !rawText ||
                  rawText === "[Instagram message]" ||
                  rawText === "[Photo/Media]" ||
                  rawText === "[Photo]" ||
                  rawText === "[Media]" ||
                  rawText === "[Video]" ||
                  rawText === "[Sticker]";

                const isOutbound =
                  message.direction === "outbound" || message.is_from_user === true;

                const displayText =
                  !isPlaceholder
                    ? rawText
                    : message.media_url
                    ? null
                    : isOutbound
                    ? "Message sent via Instagram"
                    : "[Photo/Media]";

                const hasMedia = Boolean(message.media_url);

                return (
                  <div
                    key={message.id}
                    className={`flex min-w-0 ${
                      isOutbound
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] break-words rounded-2xl p-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                        isOutbound
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm border border-white/10 bg-zinc-900 text-slate-100"
                      }`}
                    >
                      {hasMedia && (
                        <div className="overflow-hidden rounded-xl">
                          {message.media_type === "video" ? (
                            <video
                              src={message.media_url ?? undefined}
                              controls
                              playsInline
                              className="max-h-80 w-full rounded-xl bg-black/50 object-contain"
                            />
                          ) : message.media_type === "audio" ? (
                            <audio
                              src={message.media_url ?? undefined}
                              controls
                              className="w-full max-w-xs"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewMedia({
                                  url: message.media_url!,
                                  type: message.media_type,
                                })
                              }
                              className="group block cursor-zoom-in text-left focus:outline-none"
                              title="Click to preview image"
                            >
                              <img
                                src={message.media_url ?? undefined}
                                alt="Shared media"
                                loading="lazy"
                                className="max-h-80 max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                              />
                            </button>
                          )}
                        </div>
                      )}

                      {displayText && (
                        <div className={`px-1.5 ${hasMedia ? "mt-2" : ""}`}>
                          {displayText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            value={replyText}
            error={sendError}
            isSending={isSending}
            onChange={onReplyTextChange}
            onFocus={onFocusInput}
            onSend={onSend}
          />

          {previewMedia && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setPreviewMedia(null)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 p-2 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-black/70 p-2 text-slate-200 backdrop-blur transition hover:bg-black hover:text-white"
                    title="Open full size in new tab"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewMedia(null)}
                    className="rounded-full bg-black/70 p-2 text-slate-200 backdrop-blur transition hover:bg-black hover:text-white"
                    title="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
                {previewMedia.type === "video" ? (
                  <video
                    src={previewMedia.url}
                    controls
                    autoPlay
                    className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={previewMedia.url}
                    alt="Preview"
                    className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
          <MessageSquare size={48} className="text-slate-600" />
          <p>Select a conversation to view messages</p>
        </div>
      )}
    </section>
  );
}

