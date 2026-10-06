import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || '';
const META_VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || '';
const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(META_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const sigHex = signature.replace('sha256=', '');
  const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  return await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    encoder.encode(payload)
  );
}

serve(async (req) => {
  const url = new URL(req.url);

  // Handle Meta Webhook Verification (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Handle Incoming Webhook Events (POST)
  if (req.method === 'POST') {
    try {
      const payload = await req.text();
      const signature = req.headers.get('x-hub-signature-256') || '';

      if (!await verifySignature(payload, signature)) {
        return new Response('Invalid signature', { status: 401 });
      }

      // Push to Upstash Redis Queue
      const queueUrl = `${UPSTASH_REDIS_REST_URL}/lpush/webhook_queue`;
      const upstashResponse = await fetch(queueUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!upstashResponse.ok) {
        console.error('Failed to push to Upstash', await upstashResponse.text());
        // Meta still requires 200 OK to avoid retries/penalties
      }

      // Acknowledge receipt < 200ms
      return new Response('OK', { status: 200 });

    } catch (err) {
      console.error(err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
