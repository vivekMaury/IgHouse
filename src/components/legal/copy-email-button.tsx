"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyEmailButtonProps {
  email?: string;
  className?: string;
}

export function CopyEmailButton({
  email = "vivekmaury555@gmail.com",
  className = "",
}: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
        copied
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
          : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600"
      } ${className}`}
      title="Copy email to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Copied to clipboard</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Email</span>
        </>
      )}
    </button>
  );
}
