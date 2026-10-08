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

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const response = await fetch("/api/auth/instagram?format=json", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not start Meta login. Please try again.";
        throw new Error(message);
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("url" in result) ||
        typeof result.url !== "string"
      ) {
        throw new Error("The server did not return a Meta login URL.");
      }

      window.location.assign(result.url);
    } catch (requestError) {
      console.error("Server-side Instagram OAuth initialization failed.", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not start Meta login. Please try again.",
      );
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
