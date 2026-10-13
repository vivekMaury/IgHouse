"use client";

import {
  Clock,
  User,
} from "lucide-react";
import type { Conversation } from "@/types/inbox";

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  previews: Record<string, string>;
  loadError?: string;
  onSelect: (conversation: Conversation) => void;
};

export default function ConversationList({
  conversations,
  selectedConversation,
  previews,
  loadError,
  onSelect,
}: ConversationListProps) {
  // Defensive: the sidebar must never crash even if the parent passes
  // malformed data (null, non-array, or contacts with missing fields).
  // No webhook warning banners are rendered here by design — the inbox
  // works off synced history + realtime regardless of subscription state.
  let safeConversations: Conversation[] = [];
  try {
    safeConversations = Array.isArray(conversations) ? conversations : [];
  } catch {
    safeConversations = [];
  }
  const safePreviews: Record<string, string> =
    previews && typeof previews === "object" ? previews : {};

  const displayName = (conversation: Conversation): string => {
    try {
      const raw =
        conversation?.sender_username?.trim() ||
        conversation?.sender_name?.trim() ||
        conversation?.username?.trim();

      if (!raw || /^\d{10,}$/.test(raw)) {
        if (conversation?.sender_name?.trim() && !/^\d{10,}$/.test(conversation.sender_name.trim())) {
          return conversation.sender_name.trim();
        }
        const id = conversation?.sender_id || conversation?.id || raw || "";
        return id ? `User ${id.slice(-4)}` : "Instagram User";
      }
      return raw.replace(/^@/, "");
    } catch {
      return "Instagram User";
    }
  };

  const displayTime = (value: string | null | undefined): string => {
    try {
      if (!value) return "Never";
      const time = new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return time || "Never";
    } catch {
      return "Never";
    }
  };

  const handleSelect = (conversation: Conversation) => {
    try {
      onSelect(conversation);
    } catch {
      // Sidebar selection must never crash the inbox.
    }
  };

  return (
    <aside
      className={`${
        selectedConversation ? "hidden md:flex" : "flex"
      } min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-950/70 md:col-span-4 lg:col-span-3`}
    >
      {loadError && (
        <p className="m-3 rounded-lg border border-red-900/60 bg-red-950/50 p-3 text-sm text-red-200" role="alert">
          {loadError}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {safeConversations.map((conversation) => {
          const key = conversation?.id ?? Math.random().toString(36).slice(2);
          const preview = safePreviews[conversation?.id ?? ""];
          return (
            <button
              type="button"
              key={key}
              onClick={() => handleSelect(conversation)}
              className={`flex w-full min-w-0 items-center gap-3 border-b border-white/[0.06] px-4 py-4 text-left transition-colors hover:bg-white/[0.06] ${
                selectedConversation?.id === conversation?.id
                  ? "border-l-2 border-l-blue-500 bg-blue-500/10"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                {conversation?.sender_avatar_url ? (
                  <img
                    src={conversation.sender_avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-100">
                  {displayName(conversation)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  {displayTime(conversation?.last_interaction_at)}
                </div>
                {preview && (
                  <div className="mt-1 truncate text-xs text-blue-300">
                    {preview === "[Instagram message]" ? "[Photo/Media]" : preview}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {safeConversations.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No conversations yet. Sync DMs or wait for new Instagram messages.
          </div>
        )}
      </div>
    </aside>
  );
}
