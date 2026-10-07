import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureUserWorkspace(
  userId: string,
  userClient: SupabaseClient,
): Promise<string> {
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

  const { data: ownedWorkspace, error: ownedWorkspaceError } = await userClient
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownedWorkspaceError) {
    throw new Error(`Unable to check for an existing personal workspace: ${ownedWorkspaceError.message}`);
  }

  if (ownedWorkspace?.id) {
    const { error: memberError } = await userClient.from("workspace_members").insert({
      workspace_id: ownedWorkspace.id,
      user_id: userId,
      role: "owner",
    });
    if (memberError) {
      throw new Error(`Unable to link account to its personal workspace: ${memberError.message}`);
    }
    return ownedWorkspace.id;
  }

  const { data: workspace, error: createError } = await userClient
    .from("workspaces")
    .insert({ name: "Personal Workspace", owner_id: userId, plan_tier: "Pro Plan" })
    .select("id")
    .single();
  if (createError) {
    throw new Error(`Unable to create a personal workspace: ${createError.message}`);
  }
  if (!workspace?.id) {
    throw new Error("Personal workspace creation did not return a workspace ID.");
  }

  const { error: memberError } = await userClient.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "owner",
  });
  if (memberError) {
    throw new Error(`Unable to add the account to its personal workspace: ${memberError.message}`);
  }

  return workspace.id;
}
