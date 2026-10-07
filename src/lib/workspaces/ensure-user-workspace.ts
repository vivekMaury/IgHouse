import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureUserWorkspace(
  userId: string,
  userClient: SupabaseClient,
): Promise<string | null> {
  try {
    const { data: existingWorkspace, error: lookupError } = await userClient
      .from("workspaces")
      .select("id, name, owner_id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let workspaceId = existingWorkspace?.id;
    if (!workspaceId) {
      const { data: createdWorkspace, error: createError } = await userClient
        .from("workspaces")
        .insert({ name: "Personal Workspace", owner_id: userId })
        .select("id, name, owner_id")
        .single();

      if (createError) throw createError;
      if (!createdWorkspace?.id) {
        throw new Error("Workspace creation did not return a workspace ID.");
      }
      workspaceId = createdWorkspace.id;
    }

    const { data: membership, error: membershipLookupError } = await userClient
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (membershipLookupError) throw membershipLookupError;

    if (!membership) {
      const { error: membershipInsertError } = await userClient
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role: "owner",
        });
      if (membershipInsertError) throw membershipInsertError;
    }

    return workspaceId;
  } catch (error) {
    console.error("[WORKSPACE_RESOLUTION_ERROR]:", error);
    return null;
  }
}
