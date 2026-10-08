"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD_RENDER_ERROR]:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center text-gray-100">
      <h1 className="text-2xl font-semibold">We couldn&apos;t load your dashboard</h1>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        Something unexpected happened. Try loading the dashboard again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
          onClick={reset}
          type="button"
        >
          Try Again
        </button>
        <Link
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/5"
          href="/"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
