"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Zap, MessageSquare, Settings, LogOut, Command, Bell, Menu, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Automation Flows', href: '/dashboard/flows', icon: Zap },
    { name: 'Live Inbox', href: '/dashboard/inbox', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <Command className="w-6 h-6 text-purple-500" />
          <span>IgHouse</span>
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#030712] text-gray-100 overflow-hidden font-sans">
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#09090b] md:flex">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/10 bg-[#09090b] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-200 md:hidden"
              aria-label="Open navigation menu"
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
            <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[#09090b] bg-pink-500"></span>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold shadow-lg sm:h-9 sm:w-9">
              ME
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
