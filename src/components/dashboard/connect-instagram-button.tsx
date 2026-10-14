"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      getLoginStatus: (
        callback: (response: {
          status: "connected" | "not_authorized" | "unknown";
          authResponse?: {
            accessToken: string;
            userID: string;
            expiresIn: number;
            signedRequest: string;
            graphDomain?: string;
          } | null;
        }) => void,
        roundtrip?: boolean,
      ) => void;
      login: (
        callback: (response: {
          status: "connected" | "not_authorized" | "unknown";
          authResponse?: {
            accessToken: string;
            userID: string;
            expiresIn: number;
            grantedScopes?: string;
          } | null;
        }) => void,
        options?: {
          scope?: string;
          return_scopes?: boolean;
          auth_type?: string;
        },
      ) => void;
    };
  }
}

type AuthConfig = {
  appId: string;
  version: string;
  permissions: string[];
  url: string;
};

export function ConnectInstagramButton({
  connected = false,
  className,
}: {
  connected?: boolean;
  className: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [activeSessionDetected, setActiveSessionDetected] = useState(false);
  const configRef = useRef<AuthConfig | null>(null);
  const sdkReadyRef = useRef<boolean>(false);

  // Load Meta JS SDK and check existing session status on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeFacebookSdk() {
      try {
        // 1. Fetch Meta App configuration from server
        const response = await fetch("/api/auth/instagram?format=json", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return;
        const config = (await response.json()) as AuthConfig;
        if (!config?.appId || !isMounted) return;
        configRef.current = config;

        // 2. Initialize or inject the Facebook JavaScript SDK
        const onSdkLoaded = () => {
          if (!window.FB || !isMounted) return;

          try {
            window.FB.init({
              appId: config.appId,
              cookie: true, // Enables cookies so server & SDK share session
              xfbml: false,
              version: config.version || "v23.0",
            });

            sdkReadyRef.current = true;

            // 3. Leverage existing Facebook session without redundant prompts
            setIsCheckingSession(true);
            window.FB.getLoginStatus((statusResponse) => {
              if (!isMounted) return;
              setIsCheckingSession(false);
              if (statusResponse.status === "connected") {
                setActiveSessionDetected(true);
              }
            });
          } catch (initErr) {
            console.warn("Meta JavaScript SDK initialization warning:", initErr);
          }
        };

        if (window.FB) {
          onSdkLoaded();
        } else {
          window.fbAsyncInit = onSdkLoaded;

          if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            script.onerror = () => {
              console.warn("Meta SDK could not be loaded (may be blocked by ad blocker). Falling back to OAuth redirect.");
            };
            document.body.appendChild(script);
          }
        }
      } catch (err) {
        console.warn("Could not pre-fetch Meta SDK auth configuration:", err);
      }
    }

    initializeFacebookSdk();

    return () => {
      isMounted = false;
    };
  }, []);

  const exchangeTokenAndLink = async (accessToken: string) => {
    const response = await fetch("/api/auth/instagram/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || "Could not link Instagram account with the active session.");
    }

    router.replace("/dashboard?instagram=connected");
    router.refresh();
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Step A: If Meta JavaScript SDK is initialized, attempt SSO via active browser session
      if (typeof window !== "undefined" && window.FB && sdkReadyRef.current && configRef.current) {
        const config = configRef.current;
        const scopeString = config.permissions.join(",");

        // Check if user already has an active, authorized Facebook session
        const statusResponse = await new Promise<{
          status: string;
          authResponse?: { accessToken: string } | null;
        }>((resolve) => {
          window.FB?.getLoginStatus((res) => resolve(res), true);
        });

        if (statusResponse.status === "connected" && statusResponse.authResponse?.accessToken) {
          // Instant SSO! No login popup or credential prompt needed.
          await exchangeTokenAndLink(statusResponse.authResponse.accessToken);
          return;
        }

        // If not already authorized, invoke FB.login to use the existing browser session
        // Note: auth_type is NOT set to 'reauthenticate', enabling seamless single-sign on
        const loginResponse = await new Promise<{
          status: string;
          authResponse?: { accessToken: string } | null;
        }>((resolve) => {
          window.FB?.login(
            (res) => resolve(res),
            {
              scope: scopeString,
              return_scopes: true,
            },
          );
        });

        if (loginResponse.status === "connected" && loginResponse.authResponse?.accessToken) {
          await exchangeTokenAndLink(loginResponse.authResponse.accessToken);
          return;
        }

        if (loginResponse.status === "not_authorized" || !loginResponse.authResponse) {
          // User closed or dismissed the dialog
          setIsConnecting(false);
          return;
        }
      }

      // Step B: Fallback to server-side OAuth redirect if SDK is blocked or unavailable
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
      console.error("Meta Facebook login failed.", requestError);
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
        disabled={isConnecting || isCheckingSession}
        onClick={handleConnect}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : activeSessionDetected ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Camera aria-hidden="true" className="h-4 w-4" />
        )}
        {isConnecting
          ? "Connecting…"
          : activeSessionDetected
          ? connected
            ? "Connect Another Account (Active Session)"
            : "Quick Connect (Active Session)"
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
