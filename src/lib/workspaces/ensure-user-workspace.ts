import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureUserWorkspace(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (membership?.workspace_id) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", membership.workspace_id)
        .maybeSingle();
      if (workspaceError) throw workspaceError;
      if (workspace?.id) return workspace.id;
    }

    const { data: workspace, error: createError } = await supabase
      .from("workspaces")
      .insert({ name: "Personal Workspace" })
      .select("id")
      .single();
    if (createError) throw createError;
    if (!workspace?.id) {
      throw new Error("Workspace creation did not return a workspace ID.");
    }

    const { error: addMemberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "owner",
      });
    if (addMemberError) throw addMemberError;

    return workspace.id;
  } catch (error) {
    console.error("[WORKSPACE_RESOLUTION_ERROR]:", error);
    return null;
  }
}
