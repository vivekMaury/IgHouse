import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';

export const WEBHOOK_QUEUE_KEY = 'ig_events_queue';
const MAX_ATTEMPTS = 5;

export type QueuedWebhook = {
  id: string;
  receivedAt: string;
  attempts: number;
  payload: Record<string, unknown>;
};

let redisClient: Redis | undefined;

export function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.');
  }

  redisClient ??= new Redis({ url, token });
  return redisClient;
}

export async function enqueueWebhook(payload: Record<string, unknown>, attempts = 0) {
  const item: QueuedWebhook = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    attempts,
    payload,
  };

  await getRedisClient().lpush(WEBHOOK_QUEUE_KEY, JSON.stringify(item));
  return item.id;
}

export async function dequeueWebhook(): Promise<QueuedWebhook | null> {
  const value = await getRedisClient().rpop<string>(WEBHOOK_QUEUE_KEY);

  if (!value) {
    return null;
  }

  try {
    const item: unknown = JSON.parse(value);
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'payload' in item &&
      typeof item.id === 'string' &&
      typeof item.payload === 'object' &&
      item.payload !== null
    ) {
      return item as QueuedWebhook;
    }
  } catch (error) {
    console.error('Discarding malformed Instagram webhook queue item.', error);
    return null;
  }

  console.error('Discarding invalid Instagram webhook queue item.');
  return null;
}

export async function retryWebhook(item: QueuedWebhook) {
  if (item.attempts + 1 >= MAX_ATTEMPTS) {
    console.error('Instagram webhook exceeded its retry limit.', { queueItemId: item.id });
    return false;
  }

  await enqueueWebhook(item.payload, item.attempts + 1);
  return true;
}