import {
  decryptPageAccessToken,
  encryptPageAccessToken,
  refreshLongLivedAccessToken,
  replyToInstagramComment,
  sendInstagramDM,
  sendPrivateDMFromComment,
} from '@/lib/meta/graph-api';
import { getRedisClient } from '@/lib/queue/upstash';
import { createAdminClient } from '@/lib/supabase/admin';

export type InstagramEventType = 'comment' | 'message' | 'story_mention';

export type InstagramEvent = {
  instagramAccountId: string;
  senderId: string;
  eventType: InstagramEventType;
  textContent: string;
  mediaId: string | null;
  postId: string | null;
  commentId: string | null;
  eventId: string;
};

type FlowNode = {
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
};

type FlowEdge = {
  source?: string;
  target?: string;
  sourceHandle?: string | null;
};

type FlowData = { nodes: FlowNode[]; edges: FlowEdge[] };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function extractInstagramEvents(payload: Record<string, unknown>): InstagramEvent[] {
  if (payload.object !== 'instagram' || !Array.isArray(payload.entry)) {
    return [];
  }

  const events: InstagramEvent[] = [];
  for (const rawEntry of payload.entry) {
    const entry = asRecord(rawEntry);
    const instagramAccountId = textValue(entry.id);
    if (!instagramAccountId) continue;

    if (Array.isArray(entry.changes)) {
      for (const rawChange of entry.changes) {
        const change = asRecord(rawChange);
        if (change.field !== 'comments') continue;
        const value = asRecord(change.value);
        const senderId = textValue(asRecord(value.from).id);
        const commentId = textValue(value.id);
        if (!senderId || !commentId) continue;
        const mediaId = textValue(asRecord(value.media).id) || null;
        events.push({
          instagramAccountId,
          senderId,
          eventType: 'comment',
          textContent: textValue(value.text),
          mediaId,
          postId: mediaId,
          commentId,
          eventId: commentId,
        });
      }
    }

    if (Array.isArray(entry.messaging)) {
      for (const rawMessagingEvent of entry.messaging) {
        const messagingEvent = asRecord(rawMessagingEvent);
        const senderId = textValue(asRecord(messagingEvent.sender).id);
        const message = asRecord(messagingEvent.message);
        if (!senderId || senderId === instagramAccountId || !Object.keys(message).length) continue;

        const attachments = Array.isArray(message.attachments) ? message.attachments.map(asRecord) : [];
        const isStoryMention = attachments.some((attachment) => attachment.type === 'story_mention');
        const eventType: InstagramEventType = isStoryMention ? 'story_mention' : 'message';
        const eventId = textValue(message.mid) || `${textValue(messagingEvent.timestamp)}:${senderId}`;
        events.push({
          instagramAccountId,
          senderId,
          eventType,
          textContent: textValue(message.text),
          mediaId: null,
          postId: null,
          commentId: null,
          eventId,
        });
      }
    }
  }

  return events;
}

function keywordsFrom(data: Record<string, unknown>) {
  const raw = data.keywords ?? data.keyword;
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  return textValue(raw).split(',').map((keyword) => keyword.trim()).filter(Boolean);
}

function matchesKeywords(data: Record<string, unknown>, text: string) {
  const keywords = keywordsFrom(data);
  if (keywords.length === 0) return true;

  const mode = textValue(data.matchMode ?? data.matchType ?? data.operator).toLowerCase().replace(/[\s-]+/g, '_');
  if (mode === 'exact' || mode === 'exact_match') {
    return keywords.some((keyword) => keyword.toLocaleLowerCase() === text.trim().toLocaleLowerCase());
  }
  if (mode === 'regex' || mode === 'regular_expression') {
    return keywords.some((keyword) => {
      try {
        return new RegExp(keyword, 'i').test(text);
      } catch {
        return false;
      }
    });
  }

  return keywords.some((keyword) => text.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()));
}

function triggerEventMatches(node: FlowNode, event: InstagramEvent) {
  const data = node.data ?? {};
  const trigger = textValue(data.triggerEvent ?? data.eventType ?? data.label).toLowerCase();
  return event.eventType === 'comment'
    ? trigger.includes('comment')
    : event.eventType === 'story_mention'
      ? trigger.includes('story')
      : trigger.includes('dm') || trigger.includes('direct') || trigger.includes('message');
}

function triggerMatches(node: FlowNode, event: InstagramEvent) {
  return triggerEventMatches(node, event) && matchesKeywords(node.data ?? {}, event.textContent);
}

function conditionMatches(node: FlowNode, event: InstagramEvent) {
  const data = node.data ?? {};
  if (keywordsFrom(data).length > 0) return matchesKeywords(data, event.textContent);
  const conditionText = textValue(data.condition ?? data.label);
  return conditionText ? event.textContent.toLocaleLowerCase().includes(conditionText.toLocaleLowerCase()) : false;
}

function reachableActions(flow: FlowData, triggerId: string, event: InstagramEvent) {
  const nodesById = new Map(flow.nodes.filter((node): node is FlowNode & { id: string } => Boolean(node.id)).map((node) => [node.id, node]));
  const pending = flow.edges.filter((edge) => edge.source === triggerId).map((edge) => ({ id: edge.target ?? '', sourceHandle: edge.sourceHandle }));
  const visited = new Set<string>();
  const actions: FlowNode[] = [];

  while (pending.length) {
    const next = pending.shift();
    if (!next?.id || visited.has(next.id)) continue;
    visited.add(next.id);
    const node = nodesById.get(next.id);
    if (!node) continue;

    if (node.type === 'condition') {
      const matched = conditionMatches(node, event);
      if (next.sourceHandle && next.sourceHandle !== String(matched)) continue;
    }
    if (node.type === 'message') actions.push(node);

    for (const edge of flow.edges) {
      if (edge.source === next.id) {
        pending.push({ id: edge.target ?? '', sourceHandle: edge.sourceHandle });
      }
    }
  }

  return actions;
}

function flowDataFrom(value: unknown): FlowData {
  const record = asRecord(value);
  return {
    nodes: Array.isArray(record.nodes)
      ? record.nodes.filter((node): node is FlowNode => typeof node === 'object' && node !== null)
      : [],
    edges: Array.isArray(record.edges)
      ? record.edges.filter((edge): edge is FlowEdge => typeof edge === 'object' && edge !== null)
      : [],
  };
}

async function recordExecution(
  supabase: ReturnType<typeof createAdminClient>,
  workflowId: string,
  userId: string,
  event: InstagramEvent,
  status: 'MATCHED' | 'EXECUTED' | 'FAILED',
  responseSent: unknown,
  errorMessage: string | null,
  executionLogId: string,
) {
  const executionLog = {
    workflow_id: workflowId,
    user_id: userId,
    event_type: event.eventType,
    sender_id: event.senderId,
    status,
    response_sent: responseSent ?? null,
    error_message: errorMessage,
  };
  const { error: logError } = await supabase
    .from('automation_logs')
    .update(executionLog)
    .eq('id', executionLogId);
  if (logError) throw new Error(`Failed to write automation log: ${logError.message}`);
}

async function resolveWorkspaceUser(supabase: ReturnType<typeof createAdminClient>, workspaceId: string) {
  const ownerResult = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();
  if (ownerResult.error) throw ownerResult.error;
  if (ownerResult.data?.user_id) return ownerResult.data.user_id as string;

  const memberResult = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .maybeSingle();
  if (memberResult.error) throw memberResult.error;
  if (!memberResult.data?.user_id) throw new Error(`No user is associated with workspace ${workspaceId}.`);
  return memberResult.data.user_id as string;
}

async function executeWorkflow(
  supabase: ReturnType<typeof createAdminClient>,
  account: { id: string; instagram_page_id: string; access_token_encrypted: string; workspace_id: string },
  workflow: { id: string; workspace_id: string; flow_data: unknown },
  event: InstagramEvent,
  userId: string,
) {
  const flow = flowDataFrom(workflow.flow_data);
  const matchingTriggers = flow.nodes.filter((node) => node.type === 'trigger' && triggerMatches(node, event));
  if (matchingTriggers.length === 0) return;

  const { data: executionLog, error: executionLogError } = await supabase
    .from('automation_logs')
    .insert({
      workflow_id: workflow.id,
      user_id: userId,
      event_type: event.eventType,
      sender_id: event.senderId,
      status: 'MATCHED',
    })
    .select('id')
    .single();
  if (executionLogError) throw executionLogError;

  const { error: countError } = await supabase.rpc('increment_workflow_execution_count', {
    target_workflow_id: workflow.id,
  });
  if (countError) {
    const errorMessage = `Failed to increment workflow execution count: ${countError.message}`;
    await recordExecution(supabase, workflow.id, userId, event, 'FAILED', null, errorMessage, executionLog.id);
    throw new Error(errorMessage);
  }

  const actions = matchingTriggers.flatMap((trigger) => reachableActions(flow, trigger.id ?? '', event));
  if (actions.length === 0) return;

  const eventIdentity = event.eventType === 'comment' && event.postId
    ? `post:${event.postId}:sender:${event.senderId}`
    : `event:${event.eventId}`;
  const duplicateKey = `ighouse:automation:dedupe:${workflow.id}:${eventIdentity}`;
  const rateLimitKey = `ighouse:automation:rate:${workflow.id}:${event.senderId}`;
  let redis: ReturnType<typeof getRedisClient> | undefined;
  let rateLimitClaimed = false;
  let duplicateClaimed = false;
  let successfulActions = 0;
  try {
    redis = getRedisClient();
    const rateLimitClaim = await redis.set(rateLimitKey, '1', { nx: true, ex: 60 });
    if (rateLimitClaim !== 'OK') {
      return;
    }
    rateLimitClaimed = true;

    const wasAlreadyHandled = await redis.set(duplicateKey, '1', { nx: true, ex: 60 * 60 * 24 * 30 });
    if (wasAlreadyHandled !== 'OK') {
      return;
    }
    duplicateClaimed = true;

    const accessToken = decryptPageAccessToken(account.access_token_encrypted);
    const graphOptions = {
      accessToken,
      refreshAccessToken: async (currentToken: string) => {
        const refreshedToken = await refreshLongLivedAccessToken(currentToken);
        const { error } = await supabase
          .from('ig_accounts')
          .update({ access_token_encrypted: encryptPageAccessToken(refreshedToken) })
          .eq('id', account.id);
        if (error) throw new Error(`Refreshed Meta token could not be saved: ${error.message}`);
        return refreshedToken;
      },
    };
    const responses: unknown[] = [];
    for (const action of actions) {
      const data = action.data ?? {};
      const message = textValue(data.message).trim();
      if (!message) throw new Error(`Message action "${textValue(data.label) || action.id}" has no message text.`);

      const label = textValue(data.actionType ?? data.label).toLowerCase();
      if ((label.includes('public comment') || label.includes('reply to comment')) && event.commentId) {
        responses.push(await replyToInstagramComment(event.commentId, message, graphOptions));
      } else if (event.eventType === 'comment' && event.commentId) {
        responses.push(await sendPrivateDMFromComment(event.commentId, message, graphOptions));
      } else {
        const quickReplies = Array.isArray(data.quickReplies)
          ? data.quickReplies.filter((reply): reply is string => typeof reply === 'string')
          : undefined;
        responses.push(await sendInstagramDM(account.instagram_page_id, event.senderId, message, graphOptions, quickReplies));
      }
      successfulActions = responses.length;
    }
    if (responses.length === 0) {
      throw new Error('No executable message action was found for the matched workflow.');
    }
    await recordExecution(supabase, workflow.id, userId, event, 'EXECUTED', responses, null, executionLog.id);
  } catch (error) {
    if (successfulActions === 0 && redis) {
      if (duplicateClaimed) await redis.del(duplicateKey);
      if (rateLimitClaimed) await redis.del(rateLimitKey);
    }
    const message = error instanceof Error ? error.message : 'Unknown automation error.';
    await recordExecution(supabase, workflow.id, userId, event, 'FAILED', null, message, executionLog.id);
    throw error;
  }
}

export async function evaluateWorkflow(eventPayload: Record<string, unknown>) {
  const events = extractInstagramEvents(eventPayload);
  if (events.length === 0) return { events: 0, workflows: 0 };

  const supabase = createAdminClient();
  let workflowsExecuted = 0;
  for (const event of events) {
    const { data: account, error: accountError } = await supabase
      .from('ig_accounts')
      .select('id, instagram_page_id, access_token_encrypted, workspace_id')
      .eq('instagram_page_id', event.instagramAccountId)
      .eq('is_active', true)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!account?.workspace_id || !account.access_token_encrypted) {
      console.warn('Ignoring Instagram event for an unlinked or inactive account.', { accountId: event.instagramAccountId });
      continue;
    }

    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('id, workspace_id, flow_data')
      .eq('workspace_id', account.workspace_id)
      .eq('status', 'active');
    if (workflowError) throw workflowError;

    const userId = await resolveWorkspaceUser(supabase, account.workspace_id as string);
    for (const workflow of workflows ?? []) {
      const triggerNodes = flowDataFrom(workflow.flow_data).nodes.filter(
        (node) => node.type === 'trigger' && triggerEventMatches(node, event),
      );
      if (triggerNodes.length === 0) continue;

      if (!triggerNodes.some((node) => triggerMatches(node, event))) {
        continue;
      }
      await executeWorkflow(supabase, account, workflow, event, userId);
      workflowsExecuted += 1;
    }
  }

  return { events: events.length, workflows: workflowsExecuted };
}

export async function processInstagramWebhook(
  payload: Record<string, unknown>,
) {
  return evaluateWorkflow(payload);
}