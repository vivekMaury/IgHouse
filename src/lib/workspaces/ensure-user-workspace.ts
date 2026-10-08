import { createClient } from "@/utils/supabase/server";

export async function ensureUserWorkspace(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("ensure_user_workspace", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(`Workspace resolution failed: ${error.message}`);
  }
  if (typeof data !== "string" || !data) {
    throw new Error("Workspace resolution did not return a workspace ID.");
  }

  return data;
}
