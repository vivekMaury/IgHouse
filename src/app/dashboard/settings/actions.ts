"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function disconnectInstagramAccount(formData: FormData) {
  const accountId = formData.get("accountId");
  if (typeof accountId !== "string" || !accountId.trim()) {
    throw new Error("A connected account ID is required.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.workspace_id) {
    throw new Error("No workspace is available for this account.");
  }

  const { data: disconnectedAccount, error: disconnectError } = await supabase
    .from("ig_accounts")
    .update({ is_active: false, access_token_encrypted: null })
    .eq("id", accountId)
    .eq("workspace_id", membership.workspace_id)
    .select("id")
    .maybeSingle();
  if (disconnectError) throw disconnectError;
  if (!disconnectedAccount) {
    throw new Error("The Instagram account could not be found in your workspace.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?instagram=disconnected");
}
