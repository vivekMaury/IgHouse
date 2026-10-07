import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureUserWorkspace(
  userId: string,
  userClient?: SupabaseClient,
): Promise<string> {
  if (userClient) {
    const { data: membership, error: membershipError } = await userClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new Error(`Unable to load workspace membership: ${membershipError.message}`);
    }

    if (membership?.workspace_id) {
      const { data: workspace, error: workspaceError } = await userClient
        .from("workspaces")
        .select("id")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (workspaceError) {
        throw new Error(`Unable to load workspace: ${workspaceError.message}`);
      }
      if (workspace?.id) return workspace.id;
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("ensure_user_workspace", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(`Unable to resolve a workspace for this account: ${error.message}`);
  }
  if (typeof data !== "string" || !data) {
    throw new Error("Workspace resolution did not return a valid workspace ID.");
  }

  return data;
}
