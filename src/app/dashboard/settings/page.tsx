import { redirect } from "next/navigation";
import { ConnectInstagramButton } from "@/components/dashboard/connect-instagram-button";
import { SettingsTabs } from "./settings-tabs";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type DashboardSettingsPageProps = {
  searchParams?: {
    instagram?: string;
  };
};

export default async function DashboardSettingsPage({
  searchParams,
}: DashboardSettingsPageProps) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to load account settings: ${userError.message}`);
  }
  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) {
    throw new Error(`Unable to load workspace settings: ${membershipError.message}`);
  }

  const [
    { data: accounts, error: accountsError },
    { data: workspace, error: workspaceError },
  ] = membership?.workspace_id
    ? await Promise.all([
        supabase
        .from("ig_accounts")
        .select("id, username, instagram_page_id")
        .eq("workspace_id", membership.workspace_id)
        .eq("is_active", true),
        supabase
          .from("workspaces")
          .select("name")
          .eq("id", membership.workspace_id)
          .maybeSingle(),
      ])
    : [
        { data: [], error: null },
        { data: null, error: null },
      ];
  if (accountsError) {
    throw new Error(`Unable to load connected Instagram accounts: ${accountsError.message}`);
  }
  if (workspaceError) {
    throw new Error(`Unable to load workspace profile: ${workspaceError.message}`);
  }

  const instagramStatus = searchParams?.instagram;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage the Instagram accounts connected to your workspace.
        </p>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-400">
          Manage Instagram connections, integration status, and workspace details.
        </p>
        <ConnectInstagramButton
          connected={Boolean(accounts?.length)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-wait disabled:opacity-60"
        />
      </div>

      {instagramStatus === "disconnected" && (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          Instagram account disconnected.
        </p>
      )}

      <SettingsTabs
        accounts={accounts ?? []}
        appIdConfigured={Boolean(
          process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID,
        )}
        webhookConfigured={Boolean(process.env.META_VERIFY_TOKEN)}
        email={user.email ?? "No email address"}
        workspaceName={workspace?.name ?? "Workspace"}
      />
    </div>
  );
}
