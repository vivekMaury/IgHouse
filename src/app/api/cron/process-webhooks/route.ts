import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processQueuedWebhooks } from '@/lib/queue/webhook-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || !supplied) return false;

  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await processQueuedWebhooks(20);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Webhook queue processor failed.', error);
    return NextResponse.json({ error: 'Webhook queue processing failed.' }, { status: 500 });
  }
}