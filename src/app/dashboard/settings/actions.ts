"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateAppsScriptUrl, validateExternalHttpsUrl } from "@/lib/integrations/urls";
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

export async function saveWorkspaceIntegrations(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.workspace_id) {
    throw new Error("No workspace is available for this account.");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Only workspace owners and admins can update integrations.");
  }

  const webhookValue = getFormValue(formData, "webhookUrl");
  const appsScriptValue = getFormValue(formData, "googleAppsScriptUrl");
  const spreadsheetId = getFormValue(formData, "spreadsheetId");
  const newSecret = getFormValue(formData, "sharedSecretToken");
  const clearSecret = formData.get("clearSharedSecret") === "on";

  const webhookUrl = webhookValue
    ? validateExternalHttpsUrl(webhookValue, "Webhook URL")
    : null;
  const googleAppsScriptUrl = appsScriptValue
    ? validateAppsScriptUrl(appsScriptValue)
    : null;

  const { data: existing, error: existingError } = await supabase
    .from("workspace_integrations")
    .select("id, shared_secret_token")
    .eq("workspace_id", membership.workspace_id)
    .maybeSingle();
  if (existingError) throw existingError;

  const integration = {
    workspace_id: membership.workspace_id,
    webhook_url: webhookUrl,
    google_apps_script_url: googleAppsScriptUrl,
    google_sheets_spreadsheet_id: spreadsheetId || null,
    shared_secret_token: clearSecret
      ? null
      : newSecret || existing?.shared_secret_token || null,
    updated_at: new Date().toISOString(),
  };

  const { error: saveError } = existing
    ? await supabase
        .from("workspace_integrations")
        .update(integration)
        .eq("id", existing.id)
    : await supabase.from("workspace_integrations").insert(integration);
  if (saveError) throw saveError;

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?integration=saved");
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
