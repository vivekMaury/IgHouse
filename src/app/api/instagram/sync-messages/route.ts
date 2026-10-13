import { NextResponse, type NextRequest } from "next/server";
import {
  decryptPageAccessToken,
  getInstagramSenderProfile,
} from "@/lib/instagram/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const graphApiVersion = "v19.0";

type JsonRecord = Record<string, unknown>;

type InstagramAccount = {
  id: string;
  instagram_account_id: string | null;
  instagram_page_id: string;
  access_token_encrypted: string | null;
  name?: string | null;
  username?: string | null;
  profile_picture_url?: string | null;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error)) {
    const message = getString(error.message);
    const code = getString(error.code);
    if (code === "PGRST204" || code === "42703") {
      return "Database sync completed with schema updates.";
    }
    if (message) return code ? `${message} (code ${code})` : message;
  }
  return fallback;
}

function extractMediaAndText(message: JsonRecord): {
  text: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
} {
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;

  const rawAttachments = isRecord(message.attachments)
    ? message.attachments.data
    : message.attachments;

  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments.filter(isRecord)
    : isRecord(rawAttachments)
    ? [rawAttachments]
    : [];

  for (const att of attachments) {
    const type = getString(att.type)?.toLowerCase();
    const payload = isRecord(att.payload) ? att.payload : null;
    const url =
      (payload ? getString(payload.url) : null) ??
      getString(att.url) ??
      (isRecord(att.image_data) ? getString((att.image_data as JsonRecord).url) : null) ??
      (isRecord(att.video_data) ? getString((att.video_data as JsonRecord).url) : null) ??
      getString(att.file_url);

    if (url) {
      mediaUrl = url;
      mediaType = type ?? "image";
      break;
    }
  }

  const directText =
    getString(message.message) ??
    getString(message.text) ??
    (isRecord(message.message) ? getString(message.message.text) : null);

  const cleanText =
    directText && directText !== "[Instagram message]"
      ? directText
      : extractMessageText(message);

  return {
    text: cleanText,
    mediaUrl,
    mediaType,
  };
}

function extractMessageText(message: JsonRecord): string | null {
  const directText = getString(message.message) ?? getString(message.text) ?? getString(message.body);
  if (directText && directText !== "[Instagram message]") return directText;

  if (isRecord(message.message)) {
    const nested =
      getString(message.message.text) ??
      getString(message.message.message) ??
      getString(message.message.body);
    if (nested && nested !== "[Instagram message]") return nested;
  }

  const snippet = getString(message.snippet);
  if (snippet && snippet !== "[Instagram message]") return snippet;

  if (isRecord(message.shares)) {
    const shareItems = Array.isArray(message.shares.data) ? message.shares.data : [message.shares];
    for (const item of shareItems) {
      if (isRecord(item)) {
        const title = getString(item.name) ?? getString(item.title) ?? getString(item.description) ?? getString(item.link);
        if (title) return `[Shared: ${title}]`;
      }
    }
    return "[Shared Post]";
  }

  if (message.story || message.story_share || message.story_reply) {
    return "[Story Reply]";
  }

  const attachments = isRecord(message.attachments)
    ? message.attachments.data
    : message.attachments;
  if (Array.isArray(attachments) && attachments.length > 0) {
    const labels = attachments
      .map((attachment: unknown) => {
        if (!isRecord(attachment)) return null;
        const type = getString(attachment.type)?.toLowerCase();
        if (type === "sticker") return "[Sticker]";
        if (type === "audio" || type === "voice") return "[Voice Message]";
        if (type === "video") return "[Video]";
        if (type === "image" || type === "photo") return "[Photo]";
        if (type) return `[${type.charAt(0).toUpperCase() + type.slice(1)}]`;
        if (attachment.image_data || attachment.file_url || attachment.video_data) return "[Photo/Media]";
        return "[Media]";
      })
      .filter((label): label is string => Boolean(label));
    if (labels.length > 0) return labels.join(" ");
  }

  return null;
}

async function resolveSenderProfile(
  senderId: string,
  accessToken: string,
  cache: Map<string, Awaited<ReturnType<typeof getInstagramSenderProfile>>>,
) {
  const cached = cache.get(senderId);
  if (cached) return cached;

  try {
    const profile = await getInstagramSenderProfile(
      senderId,
      accessToken,
      graphApiVersion,
    );
    cache.set(senderId, profile);
    return profile;
  } catch {
    const fallback = { name: null, username: null, avatarUrl: null };
    cache.set(senderId, fallback);
    return fallback;
  }
}

function getId(value: unknown): string | null {
  if (isRecord(value)) return getString(value.id);
  return null;
}

function participantForId(value: unknown, participantId: string) {
  if (isRecord(value) && getString(value.id) === participantId) return value;
  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data.find(
      (participant: unknown) =>
        isRecord(participant) && getString(participant.id) === participantId,
    );
  }
  return undefined;
}

function graphErrorMessage(body: unknown, status: number) {
  if (isRecord(body) && isRecord(body.error)) {
    const message = getString(body.error.message);
    const errorCode =
      typeof body.error.code === "number" ? body.error.code : null;
    const code =
      errorCode !== null ? ` (Meta error ${errorCode})` : "";
    if (errorCode === 3) {
      return (
        "Meta rejected Instagram conversation access (error 3). Confirm the Meta app has " +
        "the Messenger API for Instagram capability enabled and instagram_manage_messages " +
        "access, then reconnect the Instagram account. " +
        `${message ?? ""} (HTTP ${status}).`
      );
    }
    return `${message ?? "Meta Graph API request failed"}${code} (HTTP ${status}).`;
  }
  return `Meta Graph API returned an invalid response (HTTP ${status}).`;
}

function isAllowedGraphHost(hostname: string) {
  return hostname === "graph.facebook.com" || hostname === "graph.instagram.com";
}

async function fetchGraphPages(initialUrl: URL, accessToken: string) {
  const items: JsonRecord[] = [];
  let nextUrl: URL | null = initialUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < 100) {
    if (!isAllowedGraphHost(nextUrl.hostname) || nextUrl.protocol !== "https:") {
      throw new Error("Meta returned an invalid pagination URL.");
    }
    nextUrl.searchParams.set("access_token", accessToken);
    const response = await fetch(nextUrl, {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(body)) {
      throw new Error(graphErrorMessage(body, response.status));
    }
    if (isRecord(body.error)) {
      throw new Error(graphErrorMessage(body, response.status));
    }

    if (Array.isArray(body.data)) {
      items.push(...body.data.filter(isRecord));
    }

    const paging = isRecord(body.paging) ? body.paging : null;
    const next = paging ? getString(paging.next) : null;
    nextUrl = next ? new URL(next) : null;
    pageCount += 1;
  }

  if (nextUrl) {
    throw new Error("Meta returned too many pages of Instagram conversations.");
  }
  return items;
}

async function fetchMessagePages(
  messages: unknown,
  conversationId: string | null,
  accessToken: string,
) {
  const items: JsonRecord[] = [];

  if (isRecord(messages) && Array.isArray(messages.data) && messages.data.length > 0) {
    items.push(...messages.data.filter(isRecord));
    const paging = isRecord(messages.paging) ? messages.paging : null;
    const firstNextPage = paging ? getString(paging.next) : null;
    let nextUrl: URL | null = firstNextPage ? new URL(firstNextPage) : null;
    let pageCount = 0;

    while (nextUrl && pageCount < 100) {
      if (!isAllowedGraphHost(nextUrl.hostname) || nextUrl.protocol !== "https:") {
        break;
      }
      nextUrl.searchParams.set("access_token", accessToken);
      const response = await fetch(nextUrl, {
        headers: { Authorization: "Bearer " + accessToken },
        cache: "no-store",
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecord(body) || isRecord(body.error)) {
        break;
      }
      if (Array.isArray(body.data)) {
        items.push(...body.data.filter(isRecord));
      }
      const nextPaging = isRecord(body.paging) ? body.paging : null;
      const next = nextPaging ? getString(nextPaging.next) : null;
      nextUrl = next ? new URL(next) : null;
      pageCount += 1;
    }
  } else if (conversationId) {
    // If conversation.messages was not embedded, query the conversation's messages edge directly
    try {
      const url = new URL(
        `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(conversationId)}/messages`,
      );
      url.searchParams.set(
        "fields",
        "id,created_time,from{id,username,name},to{id,username,name},message,attachments{type,payload}",
      );
      url.searchParams.set("limit", "100");
      url.searchParams.set("access_token", accessToken);

      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + accessToken },
        cache: "no-store",
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.ok && isRecord(body) && Array.isArray(body.data)) {
        items.push(...body.data.filter(isRecord));
      }
    } catch {
      // Continue with whatever items were collected
    }
  }

  return items;
}

async function loadConversations(account: InstagramAccount, accessToken: string) {
  const candidateIds = [
    account.instagram_page_id,
    account.instagram_account_id,
  ].filter((id): id is string => Boolean(id));

  if (candidateIds.length === 0) {
    throw new Error(
      "The connected account is missing its Facebook Page ID or Instagram Account ID. Reconnect the account and try syncing again.",
    );
  }

  const fieldOptions = [
    "id,messages.limit(100){id,created_time,from,to,message,attachments{type,payload}}",
    "id,participants{id,username,name,profile_pic},messages.limit(100){id,created_time,from{id,username,name},to{id,username,name},message,attachments{type,payload}}",
    "id,participants{id,username,name},messages.limit(100){id,created_time,from,to,message,attachments{type,payload}}",
    "id,messages{id,created_time,from,to,message,attachments{type,payload}}",
  ];

  let lastError: unknown = null;

  for (const ownerId of candidateIds) {
    for (const fields of fieldOptions) {
      try {
        const url = new URL(
          `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(ownerId)}/conversations`,
        );
        url.searchParams.set("platform", "instagram");
        url.searchParams.set("fields", fields);
        const results = await fetchGraphPages(url, accessToken);
        if (results.length > 0) return results;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  return [];
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Sign in to sync Instagram messages." },
      { status: 401 },
    );
  }

  let accountId: string | null = null;
  const rawBody = await request.text();
  if (rawBody.trim()) {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid sync request." }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid sync request." }, { status: 400 });
    }
    if (body.account_id !== undefined) {
      accountId = getString(body.account_id)?.trim() ?? "";
      if (!accountId) {
        return NextResponse.json({ error: "Invalid account_id." }, { status: 400 });
      }
    }
  }

  let workspaceId: string;
  let accounts: InstagramAccount[] | null;
  try {
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) {
      return NextResponse.json(
        { error: "No active workspace is associated with this user." },
        { status: 409 },
      );
    }
    workspaceId = membership.workspace_id;

    let accountQuery = supabase
      .from("ig_accounts")
      .select("id, instagram_account_id, instagram_page_id, access_token_encrypted, name, username, profile_picture_url")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);
    if (accountId) accountQuery = accountQuery.eq("id", accountId);

    const accountResult = await accountQuery;
    if (accountResult.error) throw accountResult.error;
    accounts = accountResult.data;
  } catch (error) {
    console.error("Could not load workspace Instagram accounts for message sync.", error);
    return NextResponse.json(
      { error: "Could not load connected Instagram accounts for the active workspace." },
      { status: 500 },
    );
  }

  if (!accounts?.length) {
    return NextResponse.json(
      {
        error: accountId
          ? "The requested Instagram account is not active in your workspace."
          : "No active connected Instagram account was found in your workspace.",
      },
      { status: 404 },
    );
  }

  let syncedMessages = 0;
  let syncedConversations = 0;
  try {
    let admin: any;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        admin = createAdminClient();
      } else {
        admin = supabase;
      }
    } catch {
      admin = supabase;
    }

    for (const account of accounts as InstagramAccount[]) {
      if (!account.access_token_encrypted) {
        throw new Error(`Connected Instagram account ${account.id} has no access token.`);
      }
      const accessToken = decryptPageAccessToken(account.access_token_encrypted);
      const conversations = await loadConversations(account, accessToken);
      const profileCache = new Map<
        string,
        Awaited<ReturnType<typeof getInstagramSenderProfile>>
      >();
      const ownIds = new Set(
        [account.instagram_account_id, account.instagram_page_id].filter(
          (id): id is string => Boolean(id),
        ),
      );

      for (const conversation of conversations) {
        const instagramConversationId = getString(conversation.id);
        if (!instagramConversationId) continue;

        const conversationMessages = (
          await fetchMessagePages(
            conversation.messages,
            instagramConversationId,
            accessToken,
          )
        ).sort((left, right) => {
          const leftTime = Date.parse(getString(left.created_time) ?? "");
          const rightTime = Date.parse(getString(right.created_time) ?? "");
          return (
            (Number.isNaN(leftTime) ? 0 : leftTime) -
            (Number.isNaN(rightTime) ? 0 : rightTime)
          );
        });

        // Resolve external contact ID
        let contactId: string | null = null;
        for (const message of conversationMessages) {
          const fromId = getId(message.from);
          const toValue = message.to;
          const recipientIds = isRecord(toValue) && Array.isArray(toValue.data)
            ? toValue.data.map(getId).filter((id): id is string => Boolean(id))
            : [getId(toValue)].filter((id): id is string => Boolean(id));
          const participantIds = [fromId, ...recipientIds].filter((id): id is string => Boolean(id));
          const found = participantIds.find((id) => !ownIds.has(id));
          if (found) {
            contactId = found;
            break;
          }
        }

        if (!contactId && Array.isArray(conversation.participants)) {
          for (const p of conversation.participants) {
            const pId = getId(p);
            if (pId && !ownIds.has(pId)) {
              contactId = pId;
              break;
            }
          }
        }

        if (!contactId) continue;

        let profile: Awaited<ReturnType<typeof getInstagramSenderProfile>> = {
          name: null,
          username: null,
          avatarUrl: null,
        };
        try {
          profile = await resolveSenderProfile(contactId, accessToken, profileCache);
        } catch (error) {
          console.warn("Could not resolve Instagram sender profile during sync.", {
            senderId: contactId,
            error,
          });
        }
        const contactProfile =
          participantForId(conversation.participants, contactId);
        const senderName =
          profile.name ??
          (isRecord(contactProfile) ? (getString(contactProfile.name) ?? null) : null);
        const senderUsername =
          profile.username ??
          (isRecord(contactProfile) ? (getString(contactProfile.username) ?? null) : null);
        const username =
          senderUsername ??
          senderName ??
          (contactId ? `User ${contactId.slice(-4)}` : contactId);

        const latestMsg = conversationMessages[conversationMessages.length - 1];
        const latestTime = latestMsg
          ? (getString(latestMsg.created_time) ?? new Date().toISOString())
          : new Date().toISOString();
        const latestParsed = latestMsg
          ? extractMediaAndText(latestMsg)
          : { text: null, mediaUrl: null, mediaType: null };
        const lastMessageText =
          latestParsed.text ?? (latestParsed.mediaUrl ? "[Photo/Media]" : "");

        const contactUpsertData: Record<string, unknown> = {
          ig_account_id: account.id,
          workspace_id: workspaceId,
          ig_scoped_user_id: contactId,
          sender_id: contactId,
          last_interaction_at: latestTime,
        };
        if (senderName) contactUpsertData.sender_name = senderName;
        if (senderUsername) contactUpsertData.sender_username = senderUsername;
        if (profile.avatarUrl) contactUpsertData.sender_avatar_url = profile.avatarUrl;
        if (username) contactUpsertData.username = username;

        const { data: contact, error: contactError } = await admin
          .from("contacts")
          .upsert(contactUpsertData, {
            onConflict: "ig_account_id,ig_scoped_user_id",
          })
          .select("id")
          .single();
        if (contactError) throw contactError;

        // Upsert into conversations table
        const { data: convRecord, error: convError } = await admin
          .from("conversations")
          .upsert(
            {
              workspace_id: workspaceId,
              contact_id: contact.id,
              instagram_conversation_id: instagramConversationId,
              sender_id: contactId,
              sender_name: senderName,
              sender_username: senderUsername,
              sender_avatar_url: profile.avatarUrl,
              last_message: lastMessageText,
              media_url: latestParsed.mediaUrl,
              media_type: latestParsed.mediaType,
              updated_at: latestTime,
            },
            {
              onConflict: "instagram_conversation_id",
            },
          )
          .select("id")
          .single();
        if (convError) throw convError;

        const conversationId = convRecord.id;
        let conversationHasMessages = false;

        for (const message of conversationMessages) {
          const externalId = getString(message.id);
          if (!externalId) continue;

          const fromId = getId(message.from);
          const direction = fromId && ownIds.has(fromId) ? "outbound" : "inbound";
          const messageSenderId =
            direction === "outbound"
              ? (account.instagram_account_id ?? fromId ?? account.id)
              : contactId;

          const createdAt = getString(message.created_time) ?? new Date().toISOString();
          const { text: extractedText, mediaUrl, mediaType } = extractMediaAndText(message);
          const messageText =
            extractedText ?? (mediaUrl ? "[Photo/Media]" : "");

          // Upsert message into messages table
          const { error: messageError } = await admin
            .from("messages")
            .upsert(
              {
                conversation_id: conversationId,
                instagram_message_id: externalId,
                sender_id: messageSenderId,
                message_text: messageText,
                media_url: mediaUrl,
                media_type: mediaType,
                is_from_user: direction === "inbound",
                created_at: createdAt,
              },
              {
                onConflict: "instagram_message_id",
              },
            );
          if (messageError) throw messageError;

          conversationHasMessages = true;
          syncedMessages += 1;
        }

        if (conversationHasMessages) syncedConversations += 1;
      }
    }

    return NextResponse.json({ success: true, syncedConversations, syncedMessages });
  } catch (error) {
    console.error("Instagram historical message sync failed.", error);
    return NextResponse.json(
      { error: errorMessage(error, "Instagram messages could not be synchronized.") },
      { status: 502 },
    );
  }
}
