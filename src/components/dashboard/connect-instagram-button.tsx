"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

export function ConnectInstagramButton({
  connected = false,
  className,
}: {
  connected?: boolean;
  className: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId?.trim()) {
      setError(
        "Instagram connection is unavailable. Configure NEXT_PUBLIC_META_APP_ID and rebuild the app.",
      );
      return;
    }

    setError(null);
    setIsConnecting(true);
    window.location.assign("/api/auth/instagram");
  };

  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={isConnecting}
        onClick={handleConnect}
      >
        <Camera aria-hidden="true" className="h-4 w-4" />
        {isConnecting
          ? "Redirecting to Meta…"
          : connected
            ? "Connect Another Account"
            : "Connect IG Account"}
      </button>
      {error && (
        <p className="mt-2 max-w-sm text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
