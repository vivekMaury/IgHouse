"use client";

import {
  AlertTriangle,
  Clock,
  LoaderCircle,
  User,
} from "lucide-react";
import type { Conversation } from "@/types/inbox";

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  previews: Record<string, string>;
  loadError?: string;
  showSubscriptionWarning: boolean;
  subscriptionError: string | null;
  isRetryingSubscription: boolean;
  onSelect: (conversation: Conversation) => void;
  onRetrySubscription: () => void;
  onDismissSubscriptionWarning: () => void;
};

export default function ConversationList({
  conversations,
  selectedConversation,
  previews,
  loadError,
  showSubscriptionWarning,
  subscriptionError,
  isRetryingSubscription,
  onSelect,
  onRetrySubscription,
  onDismissSubscriptionWarning,
}: ConversationListProps) {
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
      {showSubscriptionWarning && (
        <div className="m-3 rounded-lg border border-amber-700/40 bg-amber-950/40 p-3 text-sm text-amber-100" role="status">
          <div className="flex items-start gap-2">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p>
                {subscriptionError ??
                  "Instagram message events are not enabled. You can still view existing conversations."}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onRetrySubscription}
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
                  onClick={onDismissSubscriptionWarning}
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
        {conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`flex w-full min-w-0 items-center gap-3 border-b border-white/[0.06] px-4 py-4 text-left transition-colors hover:bg-white/[0.06] ${
              selectedConversation?.id === conversation.id
                ? "border-l-2 border-l-blue-500 bg-blue-500/10"
                : "border-l-2 border-l-transparent"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              {conversation.sender_avatar_url ? (
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
                {conversation.username || "Unknown User"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} />
                {conversation.last_interaction_at
                  ? new Date(conversation.last_interaction_at).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )
                  : "Never"}
              </div>
              {previews[conversation.id] && (
                <div className="mt-1 truncate text-xs text-blue-300">
                  {previews[conversation.id]}
                </div>
              )}
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No conversations yet. Sync DMs or wait for new Instagram messages.
          </div>
        )}
      </div>
    </aside>
  );
}
