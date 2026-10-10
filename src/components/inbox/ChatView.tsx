"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Bot, MessageSquare, User, UserRound } from "lucide-react";
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              <div className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 sm:flex">
                {conversation.sender_avatar_url ? (
                  <img
                    src={conversation.sender_avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={17} className="text-slate-300" />
                )}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate font-semibold text-white">
                  {conversation.sender_name ||
                    conversation.sender_username ||
                    conversation.username ||
                    conversation.sender_id ||
                    "Instagram User"}
                </div>
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
                {conversation.sender_name ||
                  conversation.sender_username ||
                  conversation.username ||
                  conversation.sender_id ||
                  "Instagram User"}
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

          <MessageInput
            value={replyText}
            error={sendError}
            isSending={isSending}
            onChange={onReplyTextChange}
            onFocus={onFocusInput}
            onSend={onSend}
          />
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
