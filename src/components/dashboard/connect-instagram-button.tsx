"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

const permissions = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
].join(",");

export function ConnectInstagramButton({
  connected = false,
  className,
}: {
  connected?: boolean;
  className: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId?.trim()) {
      setError(
        "Instagram connection is unavailable. Configure NEXT_PUBLIC_META_APP_ID and rebuild the app.",
      );
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      const response = await fetch("/api/auth/instagram?format=json", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result: unknown = await response.json();
      if (
        response.ok &&
        typeof result === "object" &&
        result !== null &&
        "url" in result &&
        typeof result.url === "string"
      ) {
        window.location.assign(result.url);
        return;
      }
    } catch (requestError) {
      console.error(
        "Server-side Instagram OAuth initialization failed; using client fallback.",
        requestError,
      );
    }

    try {
      const stateBytes = new Uint8Array(32);
      window.crypto.getRandomValues(stateBytes);
      const state = Array.from(stateBytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `ighouse_instagram_oauth_state=${state}; Path=/api/auth/instagram; Max-Age=600; SameSite=Lax${secure}`;

      const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
      const authorizationUrl = new URL(
        "https://www.facebook.com/v20.0/dialog/oauth",
      );
      authorizationUrl.search = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: permissions,
        response_type: "code",
        state,
      }).toString();
      window.location.assign(authorizationUrl.toString());
    } catch (fallbackError) {
      console.error("Unable to start Instagram OAuth in this browser.", fallbackError);
      setError("Could not open Meta login. Please try again.");
      setIsConnecting(false);
    }
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
