"use client";

import Link from "next/link";
import {
  Plus,
  Send,
  MessageCircle,
  BarChart3,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { ConnectInstagramButton } from "@/components/dashboard/connect-instagram-button";
import { formatInstagramAccountName } from "@/lib/meta/account-display";

export type DashboardViewProps = {
  workspace: { id: string; name: string; plan_tier: string | null } | null;
  accounts: Array<{
    id: string;
    username: string | null;
  }>;
  stats: {
    totalFlows: number;
    executionCount: number;
    messageCount: number;
    commentCount: number;
  };
  recentActivity: Array<{
    id: string;
    event_type: string;
    status: string;
    created_at: string;
  }>;
  searchParams: {
    instagram?: "connected" | "success" | "error";
    reason?: string;
  };
};

const connectionMessages: Record<string, string> = {
  access_denied: "Instagram access was not granted. You can try connecting again.",
  invalid_state: "The connection expired or could not be verified. Please try again.",
  no_workspace: "Your account does not have a workspace to connect to.",
  no_instagram_account:
    "No Instagram professional account linked to a Facebook Page was found. Link one in Meta and try again.",
  not_configured: "Instagram connection is not configured yet. Please contact support.",
  not_signed_in: "Please sign in before connecting an Instagram account.",
  connection_failed: "Instagram could not be connected. Please try again.",
};

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DashboardView({
  workspace,
  accounts,
  stats: dashboardStats,
  recentActivity,
  searchParams,
}: DashboardViewProps) {
  const connectedAccounts = accounts;
  const activeWorkflowCount = dashboardStats.totalFlows;
  const { executionCount, messageCount, commentCount } = dashboardStats;
  const isConnected = connectedAccounts.length > 0;
  const displayMetric = (value: number) =>
    isConnected ? value.toLocaleString("en") : "—";
  const reason = searchParams.reason;
  const connectionError = reason
    ? connectionMessages[reason] ?? connectionMessages.connection_failed
    : searchParams.instagram === "error"
      ? connectionMessages.connection_failed
      : null;
  const stats = [
    {
      label: "Messages Processed",
      value: displayMetric(messageCount),
      detail: isConnected ? "All recorded time" : "Connect Instagram to get started",
      icon: Send,
    },
    {
      label: "Comments Processed",
      value: displayMetric(commentCount),
      detail: isConnected ? "All recorded time" : "Connect Instagram to get started",
      icon: MessageCircle,
    },
    {
      label: "Total Executions",
      value: displayMetric(executionCount),
      detail: isConnected ? "All recorded time" : "Connect Instagram to get started",
      icon: BarChart3,
    },
    {
      label: "Active Automations",
      value: activeWorkflowCount.toLocaleString("en"),
      detail: "Active workflows in your workspace",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8 overflow-x-hidden">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-400 sm:text-base">
            Monitor Instagram automations and workflow activity for{" "}
            {workspace?.name ?? "your workspace"}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ConnectInstagramButton
            connected={isConnected}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
          />
          <Link
            href="/dashboard/workflows/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-pink-500"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Create Flow
          </Link>
        </div>
      </div>

      {(searchParams?.instagram === "connected" ||
        searchParams?.instagram === "success") && (
        <div
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          Instagram account connected successfully.
        </div>
      )}
      {connectionError && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {connectionError}
        </div>
      )}

      {isConnected && (
        <section
          aria-label="Connected Instagram accounts"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#09090b] p-4"
        >
          <span className="text-sm font-medium text-gray-400">
            Connected accounts
          </span>
          {connectedAccounts.map((account) => (
            <span
              key={account.id}
              className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
            >
              {formatInstagramAccountName(account.username, account.id)}
            </span>
          ))}
        </section>
      )}

      <section
        aria-label="Automation metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 mb-4 flex items-start justify-between">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-400">
                <stat.icon aria-hidden="true" className="h-5 w-5" />
              </div>
              {isConnected && stat.label !== "Active Automations" && (
                <span className="flex items-center gap-1 rounded-full border border-gray-500/20 bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-400">
                  <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                  Live data
                </span>
              )}
            </div>
            <div className="relative z-10">
              <h2 className="mb-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {stat.value}
              </h2>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="col-span-1 flex min-h-[360px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Engagement Overview
          </h2>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="relative z-10 px-4 text-center">
              <BarChart3
                aria-hidden="true"
                className="mx-auto mb-3 h-8 w-8 text-gray-600"
              />
              <p className="text-sm font-medium text-gray-300">
                {isConnected
                  ? "Your activity metrics are shown above"
                  : "Connect Instagram to start tracking"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {isConnected
                  ? "Engagement charts will appear as your automations run."
                  : "Your dashboard will update as connected automations run."}
              </p>
            </div>
          </div>
        </section>

        <section className="col-span-1 overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link
              className="text-sm text-purple-400 transition-colors hover:text-purple-300"
              href="/dashboard/inbox"
            >
              View inbox
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <ol className="space-y-5">
              {recentActivity.map((activity) => {
                const failed = activity.status.toLowerCase() === "failed";
                return (
                  <li className="relative flex min-w-0 gap-4" key={activity.id}>
                    <span
                      aria-hidden="true"
                      className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-[#09090b] ${
                        failed ? "bg-red-500" : "bg-purple-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize text-gray-200">
                        {activity.event_type.replaceAll("_", " ")} automation
                        {failed ? " failed" : " processed"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatActivityTime(activity.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Activity
                aria-hidden="true"
                className="mb-3 h-7 w-7 text-gray-600"
              />
              <p className="text-sm font-medium text-gray-300">
                No activity yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-gray-500">
                {isConnected
                  ? "Activity will appear here after your automations run."
                  : "Connect an Instagram account to get started."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
