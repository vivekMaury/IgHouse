'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export type WorkflowStatus = 'draft' | 'published';

export type FlowData = {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
};

export type SaveWorkflowInput = {
  id?: string | null;
  name: string;
  flowData: FlowData;
  status?: WorkflowStatus;
  workspaceId?: string | null;
};

export type WorkflowRecord = {
  id: string;
  workspace_id: string;
  name: string;
  status: WorkflowStatus;
  is_active: boolean;
  flow_data: FlowData;
  created_at: string;
  updated_at: string;
};

async function resolveWorkspaceId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.workspace_id ?? null;
}

export async function saveWorkflow({
  id,
  name,
  flowData,
  status = 'draft',
  workspaceId,
}: SaveWorkflowInput) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to save a workflow.');
  }

  const effectiveWorkspaceId = workspaceId ?? (await resolveWorkspaceId(supabase, user.id));

  if (!effectiveWorkspaceId) {
    throw new Error('No workspace is available for this account.');
  }

  const normalizedFlowData: FlowData = {
    nodes: Array.isArray(flowData?.nodes) ? (flowData.nodes as Array<Record<string, unknown>>) : [],
    edges: Array.isArray(flowData?.edges) ? (flowData.edges as Array<Record<string, unknown>>) : [],
  };

  const payload = {
    workspace_id: effectiveWorkspaceId,
    name: name?.trim() || 'Untitled Workflow',
    status,
    is_active: status === 'published',
    flow_data: normalizedFlowData,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data: existing, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('workflows')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      revalidatePath('/dashboard/flows');
      return updated as WorkflowRecord;
    }
  }

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidatePath('/dashboard/flows');
  return data as WorkflowRecord;
}

export async function updateWorkflowActiveStatus(id: string, isActive: boolean) {
  if (!id) {
    throw new Error('A workflow ID is required to update its status.');
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('workflows')
    .update({
      is_active: isActive,
      status: isActive ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidatePath('/dashboard/flows');
  return data as WorkflowRecord;
}

export async function getWorkflowById(id: string) {
  if (!id) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase.from('workflows').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as WorkflowRecord | null;
}

export async function listWorkflows(workspaceId?: string | null) {
  const supabase = createClient();

  let effectiveWorkspaceId = workspaceId;

  if (!effectiveWorkspaceId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return [];
    }

    const { data: memberData, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    effectiveWorkspaceId = memberData?.workspace_id ?? null;
  }

  if (!effectiveWorkspaceId) {
    return [];
  }

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('workspace_id', effectiveWorkspaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkflowRecord[];
}
