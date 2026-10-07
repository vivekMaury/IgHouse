"use client";

import { useState } from "react";
import {
  disconnectInstagramAccount,
  saveWorkspaceIntegrations,
} from "./actions";

type ConnectedAccount = {
  id: string;
  username: string | null;
  instagram_page_id: string;
};

type SettingsTab = "accounts" | "integrations" | "meta" | "profile";

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "accounts", label: "Instagram Accounts" },
  { id: "integrations", label: "Lead Integrations" },
  { id: "meta", label: "Meta API" },
  { id: "profile", label: "Profile & Workspace" },
];

export function SettingsTabs({
  accounts,
  appIdConfigured,
  webhookConfigured,
  email,
  workspaceName,
  canManageIntegrations,
  webhookUrl,
  googleAppsScriptUrl,
  spreadsheetId,
  sharedSecretConfigured,
}: {
  accounts: ConnectedAccount[];
  appIdConfigured: boolean;
  webhookConfigured: boolean;
  email: string;
  workspaceName: string;
  canManageIntegrations: boolean;
  webhookUrl: string;
  googleAppsScriptUrl: string;
  spreadsheetId: string;
  sharedSecretConfigured: boolean;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("accounts");

  return (
    <section>
      <div
        aria-label="Settings sections"
        className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            aria-controls={`settings-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-purple-400 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && (
        <div
          aria-labelledby="settings-tab-accounts"
          className="rounded-2xl border border-white/10 bg-[#09090b] p-5 sm:p-6"
          id="settings-panel-accounts"
          role="tabpanel"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">
              Connected Instagram accounts
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Manage the Instagram professional accounts connected to your
              workspace.
            </p>
          </div>

          {accounts.length > 0 ? (
            <ul className="mt-6 divide-y divide-white/10">
              {accounts.map((account) => (
                <li
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  key={account.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {account.username
                        ? `@${account.username}`
                        : "Instagram account"}
                    </p>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Page ID: {account.instagram_page_id}
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      Connected
                    </span>
                  </div>
                  <form action={disconnectInstagramAccount}>
                    <input
                      name="accountId"
                      type="hidden"
                      value={account.id}
                    />
                    <button
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                      type="submit"
                    >
                      Disconnect
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-gray-400">
              No Instagram accounts are connected to this workspace yet.
            </p>
          )}
        </div>
      )}

      {activeTab === "integrations" && (
        <div
          aria-labelledby="settings-tab-integrations"
          className="rounded-2xl border border-white/10 bg-[#09090b] p-5 sm:p-6"
          id="settings-panel-integrations"
          role="tabpanel"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">
              Lead export destinations
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              New leads are sent to each configured destination as JSON. URLs
              must use HTTPS.
            </p>
          </div>

          {canManageIntegrations ? (
            <form action={saveWorkspaceIntegrations} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-200">
                  Outbound webhook URL
                </span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400"
                  defaultValue={webhookUrl}
                  name="webhookUrl"
                  placeholder="https://example.com/webhooks/leads"
                  type="url"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-200">
                  Google Apps Script Web App URL
                </span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400"
                  defaultValue={googleAppsScriptUrl}
                  name="googleAppsScriptUrl"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  type="url"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-200">
                  Google Sheets spreadsheet ID (optional)
                </span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400"
                  defaultValue={spreadsheetId}
                  name="spreadsheetId"
                  placeholder="Spreadsheet ID passed to your Apps Script"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-200">
                  Shared secret token (optional)
                </span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400"
                  name="sharedSecretToken"
                  placeholder={
                    sharedSecretConfigured
                      ? "Configured; leave blank to keep the current token"
                      : "Optional receiver authentication token"
                  }
                  type="password"
                />
                {sharedSecretConfigured && (
                  <span className="mt-1.5 block text-xs text-emerald-300">
                    A shared secret is configured and will not be shown here.
                  </span>
                )}
              </label>

              {sharedSecretConfigured && (
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    className="rounded border-white/20 bg-white/5"
                    name="clearSharedSecret"
                    type="checkbox"
                  />
                  Remove the saved shared secret
                </label>
              )}

              <button
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
                type="submit"
              >
                Save integration settings
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
              Only workspace owners and admins can view or change lead export
              settings.
            </p>
          )}
        </div>
      )}

      {activeTab === "meta" && (
        <div
          aria-labelledby="settings-tab-meta"
          className="space-y-4 rounded-2xl border border-white/10 bg-[#09090b] p-5 sm:p-6"
          id="settings-panel-meta"
          role="tabpanel"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Meta API settings</h2>
            <p className="mt-1 text-sm text-gray-400">
              Configuration indicators for the Meta integration.
            </p>
          </div>
          <StatusRow
            label="Meta App ID"
            status={appIdConfigured ? "Configured" : "Not configured"}
            ready={appIdConfigured}
          />
          <StatusRow
            label="Webhook verification"
            status={webhookConfigured ? "Configured" : "Not configured"}
            ready={webhookConfigured}
          />
          <p className="text-xs leading-5 text-gray-500">
            These indicators check server configuration; they do not perform a
            live Meta API or webhook health check.
          </p>
        </div>
      )}

      {activeTab === "profile" && (
        <div
          aria-labelledby="settings-tab-profile"
          className="space-y-4 rounded-2xl border border-white/10 bg-[#09090b] p-5 sm:p-6"
          id="settings-panel-profile"
          role="tabpanel"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">
              Account profile
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Your signed-in account and workspace details.
            </p>
          </div>
          <InfoRow label="Email address" value={email} />
          <InfoRow label="Workspace" value={workspaceName} />
        </div>
      )}
    </section>
  );
}

function StatusRow({
  label,
  status,
  ready,
}: {
  label: string;
  status: string;
  ready: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <span
        className={`inline-flex items-center gap-2 text-sm ${
          ready ? "text-emerald-300" : "text-amber-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            ready ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {status}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-gray-200">{value}</p>
    </div>
  );
}
