import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type QuickReply = string | { title: string; payload?: string };

export type GraphApiOptions = {
  accessToken: string;
  apiVersion?: string;
  refreshAccessToken?: (accessToken: string) => Promise<string>;
};

type GraphResponse = Record<string, unknown>;

function getPageTokenEncryptionKey(): Buffer {
  const rawKey = process.env.META_TOKEN_ENCRYPTION_KEY ?? '';
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!cleanKey) {
    throw new Error('META_TOKEN_ENCRYPTION_KEY is required to encrypt or decrypt Instagram Page tokens.');
  }

  if (/^[\da-f]{64}$/i.test(cleanKey)) {
    return Buffer.from(cleanKey, 'hex');
  }

  if (cleanKey.length === 32) {
    const key = Buffer.from(cleanKey, 'utf8');
    if (key.length === 32) return key;
  }

  if (/^[A-Za-z0-9+/_-]{43}=?$/.test(cleanKey)) {
    const normalizedBase64 = cleanKey.replace(/-/g, '+').replace(/_/g, '/');
    const key = Buffer.from(normalizedBase64, 'base64');
    const canonicalBase64 = key.toString('base64').replace(/=+$/, '');
    if (
      key.length === 32 &&
      canonicalBase64 === normalizedBase64.replace(/=+$/, '')
    ) {
      return key;
    }
  }

  throw new Error(
    'META_TOKEN_ENCRYPTION_KEY must be a 64-character hex key, a 32-byte UTF-8 key, or a base64-encoded 32-byte key.',
  );
}

export function decryptPageAccessToken(encryptedToken: string) {
  const [version, ivValue, authTagValue, ciphertextValue, ...extra] = encryptedToken.split('.');
  if (version !== 'v1' || !ivValue || !authTagValue || !ciphertextValue || extra.length > 0) {
    throw new Error('The stored Page token must use the v1 AES-256-GCM format.');
  }

  const iv = Buffer.from(ivValue, 'base64');
  const authTag = Buffer.from(authTagValue, 'base64');
  const ciphertext = Buffer.from(ciphertextValue, 'base64');
  if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
    throw new Error('The stored Page token has invalid AES-GCM components.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getPageTokenEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function encryptPageAccessToken(accessToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getPageTokenEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(accessToken, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.');
}

export async function refreshLongLivedAccessToken(accessToken: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID and META_APP_SECRET are required to refresh the Meta token.');
  }

  const version = process.env.META_GRAPH_API_VERSION ?? 'v23.0';
  const response = await fetch(`https://graph.facebook.com/${version}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'fb_exchange_token',
      fb_exchange_token: accessToken,
    }),
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    typeof body !== 'object' ||
    body === null ||
    !('access_token' in body) ||
    typeof body.access_token !== 'string'
  ) {
    const error = typeof body === 'object' && body !== null && 'error' in body
      ? (body as { error?: { message?: string } }).error?.message
      : undefined;
    throw new Error(error ?? `Meta token refresh failed with HTTP ${response.status}. Reconnect the Instagram account.`);
  }
  return body.access_token;
}

async function graphPost<T extends GraphResponse>(
  path: string,
  body: Record<string, unknown>,
  options: GraphApiOptions,
): Promise<T> {
  const version = options.apiVersion ?? process.env.META_GRAPH_API_VERSION ?? 'v23.0';
  let accessToken = options.accessToken;
  let tokenRefreshed = false;

  while (true) {
    const response = await fetch(`https://graph.facebook.com/${version}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const usageHeader = response.headers.get('x-app-usage');
    if (usageHeader) {
      try {
        const usage = JSON.parse(usageHeader) as Record<string, number>;
        if (Object.values(usage).some((value) => value >= 80)) {
          console.warn('Meta Graph API usage is approaching its limit.', usage);
        }
      } catch {
        console.warn('Meta returned an unreadable X-App-Usage header.');
      }
    }

    const responseBody: unknown = await response.json().catch(() => null);
    const graphError =
      typeof responseBody === 'object' && responseBody !== null && 'error' in responseBody
        ? (responseBody as { error?: { message?: string; code?: number; type?: string } }).error
        : undefined;

    if (!response.ok || graphError) {
      const errorMessage = graphError?.message ?? `Meta Graph API request failed with HTTP ${response.status}.`;
      const errorCode = graphError?.code;
      if (errorCode === 190 && !tokenRefreshed && options.refreshAccessToken) {
        accessToken = await options.refreshAccessToken(accessToken);
        tokenRefreshed = true;
        continue;
      }
      console.error('Meta Graph API request failed.', {
        path,
        status: response.status,
        code: errorCode,
        message: errorMessage,
      });
      if (errorCode === 190) {
        throw new Error(`Instagram Page token is invalid or expired. Reconnect the account. ${errorMessage}`);
      }
      throw new Error(errorMessage);
    }

    return (responseBody ?? {}) as T;
  }
}

export async function sendInstagramDM(
  instagramAccountId: string,
  recipientId: string,
  messageText: string,
  options: GraphApiOptions,
  quickReplies?: QuickReply[],
) {
  const message: Record<string, unknown> = { text: messageText };
  if (quickReplies?.length) {
    message.quick_replies = quickReplies.map((reply) =>
      typeof reply === 'string'
        ? { content_type: 'text', title: reply, payload: reply }
        : { content_type: 'text', title: reply.title, payload: reply.payload ?? reply.title },
    );
  }

  return graphPost(`${encodeURIComponent(instagramAccountId)}/messages`, {
    recipient: { id: recipientId },
    message,
    messaging_type: 'RESPONSE',
  }, options);
}

export async function subscribeInstagramMessages(
  pageId: string,
  options: GraphApiOptions,
) {
  const version =
    options.apiVersion ?? process.env.META_GRAPH_API_VERSION ?? 'v23.0';
  const url = new URL(
    `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/subscribed_apps`,
  );
  url.searchParams.set('subscribed_fields', 'messages,messaging_postbacks,feed');

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.accessToken}` },
    cache: 'no-store',
  });
  const body: unknown = await response.json().catch(() => null);
  const graphError =
    typeof body === 'object' && body !== null && 'error' in body
      ? (body as { error?: { message?: string } }).error
      : undefined;

  if (
    !response.ok ||
    graphError ||
    !body ||
    typeof body !== 'object' ||
    !('success' in body) ||
    body.success !== true
  ) {
    const message =
      graphError?.message ??
      `Meta did not confirm the Instagram messaging webhook subscription (HTTP ${response.status}).`;
    throw new Error(message);
  }
}

export async function replyToInstagramComment(
  commentId: string,
  messageText: string,
  options: GraphApiOptions,
) {
  return graphPost(`${encodeURIComponent(commentId)}/replies`, { message: messageText }, options);
}

export async function sendPrivateDMFromComment(
  commentId: string,
  messageText: string,
  options: GraphApiOptions,
) {
  return graphPost(`${encodeURIComponent(commentId)}/private_replies`, { message: messageText }, options);
}