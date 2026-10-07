import {
  decryptPageAccessToken,
  encryptPageAccessToken,
  refreshLongLivedAccessToken,
  replyToInstagramComment,
  sendInstagramDM,
  sendPrivateDMFromComment,
} from '@/lib/meta/graph-api';
import type { GraphApiOptions } from '@/lib/meta/graph-api';
import { validateExternalHttpsUrl } from '@/lib/integrations/urls';
import { getRedisClient } from '@/lib/queue/upstash';
import { createAdminClient } from '@/lib/supabase/admin';

export type InstagramEventType = 'comment' | 'message' | 'story_mention';

export type InstagramEvent = {
  instagramAccountId: string;
  senderId: string;
  eventType: InstagramEventType;
  textContent: string;
  userHandle: string | null;
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
          userHandle: textValue(asRecord(value.from).username) || null,
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
        const sender = asRecord(messagingEvent.sender);
        const senderId = textValue(sender.id);
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
          userHandle: textValue(sender.username) || textValue(sender.name) || null,
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
    if (node.type === 'message' || node.type === 'lead_capture') actions.push(node);

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

function extractLeadContact(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phoneCandidate = text.match(/\+?\d(?:[\d\s().-]{5,}\d)(?:\s*(?:ext\.?|x)\s*\d{1,6})?/i)?.[0] ?? null;
  const phoneDigits = phoneCandidate?.replace(/\D/g, '') ?? '';
  const phone = phoneDigits.length >= 7 && phoneDigits.length <= 15
    ? phoneCandidate?.trim() ?? null
    : null;

  return { email, phone };
}

async function saveCapturedLead(
  supabase: ReturnType<typeof createAdminClient>,
  account: { id: string; workspace_id: string },
  event: InstagramEvent,
  email: string | null,
  phone: string | null,
) {
  let userHandle = event.userHandle;
  if (!userHandle) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('username')
      .eq('ig_account_id', account.id)
      .eq('ig_scoped_user_id', event.senderId)
      .maybeSingle();
    if (contactError) throw contactError;
    userHandle = textValue(contact?.username) || event.senderId;
  }

  const { data: lead, error } = await supabase
    .from('captured_leads')
    .upsert(
      {
        workspace_id: account.workspace_id,
        instagram_account_id: account.id,
        user_handle: userHandle,
        email,
        phone,
        source_event_id: event.eventId,
      },
      { onConflict: 'instagram_account_id,source_event_id' },
    )
    .select('id, workspace_id, instagram_account_id, user_handle, email, phone, created_at')
    .single();
  if (error) throw new Error(`Failed to save captured Instagram lead: ${error.message}`);
  return lead;
}

async function exportCapturedLead(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  lead: {
    id: string;
    workspace_id: string;
    instagram_account_id: string;
    user_handle: string;
    email: string | null;
    phone: string | null;
    created_at: string;
  },
  eventId: string,
) {
  const { data: integration, error } = await supabase
    .from('workspace_integrations')
    .select('webhook_url, google_apps_script_url, google_sheets_spreadsheet_id, shared_secret_token')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load workspace lead integrations: ${error.message}`);

  if (!integration?.webhook_url && !integration?.google_apps_script_url) return;

  const payload = {
    event: 'lead.captured',
    event_id: eventId,
    lead: {
      id: lead.id,
      workspace_id: lead.workspace_id,
      instagram_account_id: lead.instagram_account_id,
      user_handle: lead.user_handle,
      email: lead.email,
      phone: lead.phone,
      created_at: lead.created_at,
    },
  };
  const destinations: Array<Promise<void>> = [];

  if (integration.webhook_url) {
    const url = validateExternalHttpsUrl(integration.webhook_url, 'Configured webhook URL');
    destinations.push(
      postLead(url, payload, integration.shared_secret_token, 'Webhook'),
    );
  }

  if (integration.google_apps_script_url) {
    const url = validateExternalHttpsUrl(
      integration.google_apps_script_url,
      'Configured Google Apps Script URL',
    );
    destinations.push(
      postLead(
        url,
        {
          ...payload,
          token: integration.shared_secret_token,
          spreadsheet_id: integration.google_sheets_spreadsheet_id,
        },
        null,
        'Google Apps Script',
        true,
      ),
    );
  }

  const results = await Promise.allSettled(destinations);
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));
  if (failures.length > 0) {
    throw new Error(`Lead export failed: ${failures.join('; ')}`);
  }
}

async function postLead(
  url: string,
  payload: Record<string, unknown>,
  sharedSecret: string | null,
  destination: string,
  followAppsScriptRedirects = false,
) {
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json',
    ...(sharedSecret ? { Authorization: `Bearer ${sharedSecret}` } : {}),
  };
  let target = url;
  let response: Response;

  for (let redirects = 0; ; redirects += 1) {
    try {
      response = await fetch(target, {
        method: 'POST',
        headers,
        body,
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${destination} request failed: ${message}`);
    }

    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!followAppsScriptRedirects || !location || redirects >= 2) {
      throw new Error(`${destination} returned an unsupported redirect.`);
    }

    const redirectedUrl = new URL(location, target);
    if (
      redirectedUrl.protocol !== 'https:' ||
      !(
        redirectedUrl.hostname === 'script.googleusercontent.com' ||
        redirectedUrl.hostname.endsWith('.script.googleusercontent.com')
      )
    ) {
      throw new Error(`${destination} redirected to an untrusted host.`);
    }
    target = redirectedUrl.toString();
  }

  if (!response.ok) {
    throw new Error(`${destination} responded with HTTP ${response.status}.`);
  }
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

  const actions = matchingTriggers
    .flatMap((trigger) => reachableActions(flow, trigger.id ?? '', event))
    .sort((left, right) => Number(right.type === 'lead_capture') - Number(left.type === 'lead_capture'));
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

    let graphOptions: GraphApiOptions | null = null;
    const responses: unknown[] = [];
    for (const action of actions) {
      const data = action.data ?? {};
      if (action.type === 'lead_capture') {
        if (event.eventType !== 'message') continue;
        const { email, phone } = extractLeadContact(event.textContent);
        if (!email && !phone) continue;
        const lead = await saveCapturedLead(supabase, account, event, email, phone);
        await exportCapturedLead(supabase, workflow.workspace_id, lead, event.eventId);
        successfulActions += 1;
        continue;
      }

      const message = textValue(data.message).trim();
      if (!message) throw new Error(`Message action "${textValue(data.label) || action.id}" has no message text.`);

      if (!graphOptions) {
        graphOptions = {
          accessToken: decryptPageAccessToken(account.access_token_encrypted),
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
      }
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
    await recordExecution(
      supabase,
      workflow.id,
      userId,
      event,
      'EXECUTED',
      responses,
      null,
      executionLog.id,
    );
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
      .eq('is_active', true);
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