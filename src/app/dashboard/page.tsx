import { redirect } from "next/navigation";
import DashboardView from "./dashboard-view";
import type { DashboardViewProps } from "./dashboard-view";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type DashboardSearchParams = {
  instagram?: string | string[];
  reason?: string | string[];
};

const validInstagramStatuses = new Set(["connected", "success", "error"]);
const validConnectionReasons = new Set([
  "access_denied",
  "invalid_state",
  "no_workspace",
  "no_instagram_account",
  "not_configured",
  "not_signed_in",
  "connection_failed",
]);

type InstagramStatus = NonNullable<
  NonNullable<DashboardViewProps["searchParams"]>["instagram"]
>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isInstagramStatus(value: string | undefined): value is InstagramStatus {
  return value !== undefined && validInstagramStatuses.has(value);
}

export default async function DashboardOverview({
  searchParams = {},
}: {
  searchParams?: DashboardSearchParams;
}) {
  let supabase: ReturnType<typeof createClient> | null = null;
  let user: { id: string } | null = null;

  try {
    supabase = createClient();
    const {
      data: { user: authenticatedUser },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("[DASHBOARD_AUTH_ERROR]:", error);
    } else {
      user = authenticatedUser;
    }
  } catch (error) {
    console.error("[DASHBOARD_AUTH_ERROR]:", error);
  }

  if (!user || !supabase) redirect("/login");

  let workspace: DashboardViewProps["workspace"] = null;
  let accounts: DashboardViewProps["accounts"] = [];
  let stats: DashboardViewProps["stats"] = {
    totalFlows: 0,
    executionCount: 0,
    messageCount: 0,
    commentCount: 0,
  };
  let recentActivity: DashboardViewProps["recentActivity"] = [];

  try {
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (membership?.workspace_id) {
      const [
        workspaceResult,
        accountsResult,
        workflowsResult,
        executionResult,
        messagesResult,
        commentsResult,
        activityResult,
      ] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id, name, plan_tier")
          .eq("id", membership.workspace_id)
          .maybeSingle(),
        supabase
          .from("ig_accounts")
          .select("id, username")
          .eq("workspace_id", membership.workspace_id)
          .eq("is_active", true),
        supabase
          .from("workflows")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", membership.workspace_id)
          .eq("status", "active"),
        supabase
          .from("automation_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("automation_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("event_type", "message"),
        supabase
          .from("automation_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("event_type", "comment"),
        supabase
          .from("automation_logs")
          .select("id, event_type, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const queryError = [
        workspaceResult.error,
        accountsResult.error,
        workflowsResult.error,
        executionResult.error,
        messagesResult.error,
        commentsResult.error,
        activityResult.error,
      ].find(Boolean);
      if (queryError) throw queryError;

      workspace = workspaceResult.data;
      accounts = accountsResult.data ?? [];
      stats = {
        totalFlows: workflowsResult.count ?? 0,
        executionCount: executionResult.count ?? 0,
        messageCount: messagesResult.count ?? 0,
        commentCount: commentsResult.count ?? 0,
      };
      recentActivity = activityResult.data ?? [];
    }
  } catch (error) {
    console.error("[DASHBOARD_DATA_ERROR]:", error);
    workspace = null;
    accounts = [];
    stats = {
      totalFlows: 0,
      executionCount: 0,
      messageCount: 0,
      commentCount: 0,
    };
    recentActivity = [];
  }

  const instagram = firstValue(searchParams.instagram);
  const reason = firstValue(searchParams.reason);

  return (
    <DashboardView
      workspace={workspace}
      accounts={accounts}
      stats={stats}
      recentActivity={recentActivity}
      searchParams={{
        instagram: isInstagramStatus(instagram) ? instagram : undefined,
        reason: validConnectionReasons.has(reason ?? "") ? reason : undefined,
      }}
    />
  );
}
