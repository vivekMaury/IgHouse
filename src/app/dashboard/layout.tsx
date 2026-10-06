"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  MessageSquare,
  Settings,
  LogOut,
  Command,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Automation Flows", href: "/dashboard/workflows", icon: Zap },
  { name: "Live Inbox", href: "/dashboard/inbox", icon: MessageSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    const { error } = await createClient().auth.signOut();
    if (error) {
      setSignOutError("Could not sign out. Please try again.");
      setIsSigningOut(false);
      console.error("Supabase sign out failed:", error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <Link
          aria-label="IgHouse dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
        >
          <Command aria-hidden="true" className="h-6 w-6 text-purple-500" />
          <span>IgHouse</span>
        </Link>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Workspace" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === "/dashboard/workflows" &&
                  pathname.startsWith("/dashboard/flows"));

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-purple-500/10 text-purple-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
              }`}
            >
              <item.icon
                aria-hidden="true"
                className={`h-5 w-5 ${isActive ? "text-purple-400" : "text-gray-500"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {signOutError && (
          <p className="mb-2 px-3 text-xs text-red-400" role="alert">
            {signOutError}
          </p>
        )}
        <button
          type="button"
          disabled={isSigningOut}
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#030712] font-sans text-gray-100">
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#09090b] md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}
        >
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#09090b] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#09090b]/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-200 md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/5 bg-white/10 px-2 py-1 text-xs font-medium text-gray-200 sm:text-sm">
                Personal Workspace
              </span>
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-400 sm:text-xs">
                Pro Plan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[#09090b] bg-pink-500" />
            </button>
            <div
              aria-label="Account profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold shadow-lg sm:h-9 sm:w-9"
            >
              ME
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
