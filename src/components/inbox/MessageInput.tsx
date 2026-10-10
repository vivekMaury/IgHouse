"use client";

import { LoaderCircle, Send } from "lucide-react";

type MessageInputProps = {
  value: string;
  error: string | null;
  isSending: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSend: () => void;
};

export default function MessageInput({
  value,
  error,
  isSending,
  onChange,
  onFocus,
  onSend,
}: MessageInputProps) {
  return (
    <div className="shrink-0 border-t border-white/10 bg-zinc-950/70 p-3 sm:p-4">
      {error && (
        <p className="mb-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <form
        className="flex min-w-0 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          placeholder="Type an Instagram message..."
          maxLength={1000}
          disabled={isSending}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
          aria-label="Message text"
        />
        <button
          type="submit"
          disabled={!value.trim() || isSending}
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
  );
}
