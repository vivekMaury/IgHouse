import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { evaluateWorkflow } from '@/lib/workflow-engine';
import { enqueueWebhook } from '@/lib/queue/upstash';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getEventTypes(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.entry)) {
    return ['unknown'];
  }

  const eventTypes = new Set<string>();

  for (const entry of payload.entry) {
    if (!isRecord(entry)) continue;

    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (isRecord(change) && typeof change.field === 'string') {
          eventTypes.add(change.field);
        }
      }
    }

    if (Array.isArray(entry.messaging)) {
      for (const event of entry.messaging) {
        if (!isRecord(event)) continue;
        if ('message' in event) eventTypes.add('messages');
        if ('postback' in event) eventTypes.add('messaging_postbacks');
        if ('read' in event) eventTypes.add('message_reads');
        if ('delivery' in event) eventTypes.add('message_deliveries');
      }
    }
  }

  return eventTypes.size > 0 ? Array.from(eventTypes) : ['unknown'];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expectedToken = (
    process.env.META_WEBHOOK_VERIFY_TOKEN ?? process.env.META_VERIFY_TOKEN
  )?.trim();

  if (!expectedToken) {
    console.error(
      'Instagram webhook verification failed: META_WEBHOOK_VERIFY_TOKEN is not configured.',
    );
    return NextResponse.json(
      { error: 'Webhook verification is not configured.' },
      { status: 500 },
    );
  }

  if (mode !== 'subscribe' || verifyToken !== expectedToken || challenge === null) {
    return NextResponse.json(
      { error: 'Webhook verification failed.' },
      { status: 403 },
    );
  }

  return new Response(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function hasValidSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signature) return false;

  const match = /^sha256=([a-f\d]{64})$/i.exec(signature);
  if (!match) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  const received = Buffer.from(match[1], 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error('Failed to read Instagram webhook request body.', error);
    return NextResponse.json({ error: 'Unable to read webhook body.' }, { status: 400 });
  }

  if (!hasValidSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    console.error('Rejected Instagram webhook with an invalid or missing signature.');
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Failed to parse Instagram webhook JSON payload.', error);
    return NextResponse.json({ error: 'Invalid JSON webhook payload.' }, { status: 400 });
  }

  if (!isRecord(payload)) {
    console.error('Instagram webhook payload must be a JSON object.');
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  const eventTypes = getEventTypes(payload);
  console.log('Instagram webhook payload event:', {
    object: typeof payload.object === 'string' ? payload.object : 'unknown',
    eventTypes,
  });

  let queueStatus: 'processed' | 'queued' | 'failed' = 'processed';
  const downstreamErrors: string[] = [];
  try {
    const result = await evaluateWorkflow(payload);
    console.log('Instagram workflow evaluation completed.', {
      events: result.events,
      workflows: result.workflows,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    downstreamErrors.push(`Direct workflow evaluation failed: ${message}`);
    console.error('Instagram webhook workflow evaluation failed.', error);

    try {
      const eventId = await enqueueWebhook(payload);
      queueStatus = 'queued';
      console.log('Instagram webhook queued for retry:', eventId);
    } catch (queueError) {
      queueStatus = 'failed';
      const queueMessage = getErrorMessage(queueError);
      downstreamErrors.push(`Redis queue push failed: ${queueMessage}`);
      console.error('Instagram webhook Redis queue push failed.', queueError);
    }
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('webhook_logs').insert({
      object_type: typeof payload.object === 'string' ? payload.object : null,
      event_types: eventTypes,
      queue_status: queueStatus,
      error_message: downstreamErrors.length > 0 ? downstreamErrors.join('; ') : null,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const message = getErrorMessage(error);
    downstreamErrors.push(`Supabase webhook logging failed: ${message}`);
    console.error('Instagram webhook Supabase logging failed.', error);
  }

  if (queueStatus === 'failed') {
    return NextResponse.json(
      { success: false, processed: false, queued: false },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    processed: queueStatus === 'processed',
    queued: queueStatus === 'queued',
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
