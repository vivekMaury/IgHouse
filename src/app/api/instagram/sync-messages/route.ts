import { NextResponse, type NextRequest } from "next/server";
import {
  decryptPageAccessToken,
} from "@/lib/meta/graph-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type InstagramAccount = {
  id: string;
  instagram_account_id: string | null;
  instagram_page_id: string;
  access_token_encrypted: string | null;
};

type SenderProfile = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
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
      return "The Supabase database is missing Live Inbox columns. Apply the latest Supabase migration, then retry syncing.";
    }
    if (message) return code ? `${message} (code ${code})` : message;
  }
  return fallback;
}

function extractMessageText(message: JsonRecord) {
  const text = getString(message.message) ?? getString(message.text);
  if (text) return text;

  const attachments = isRecord(message.attachments)
    ? message.attachments.data
    : message.attachments;
  if (Array.isArray(attachments)) {
    const labels = attachments.map((attachment: unknown) => {
      if (!isRecord(attachment)) return null;
      const type = getString(attachment.type)?.toLowerCase();
      if (type === "sticker") return "[Sticker]";
      if (type) return "[Media/Image]";
      return null;
    }).filter(
      (label): label is "[Sticker]" | "[Media/Image]" => label !== null,
    );
    if (labels.length > 0) return labels.join(" ");
  }

  return null;
}

async function resolveSenderProfile(
  senderId: string,
  accessToken: string,
  cache: Map<string, SenderProfile>,
): Promise<SenderProfile> {
  const cached = cache.get(senderId);
  if (cached) return cached;

  const version = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  const url = new URL(
    `https://graph.facebook.com/${version}/${encodeURIComponent(senderId)}`,
  );
  url.searchParams.set("fields", "id,name,username,profile_pic");
  // Use the bearer header so the token is not included in request URLs.
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + accessToken },
    cache: "no-store",
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(body) || isRecord(body.error)) {
    throw new Error(graphErrorMessage(body, response.status));
  }

  const profile: SenderProfile = {
    id: getString(body.id) ?? senderId,
    name: getString(body.name),
    username: getString(body.username),
    avatarUrl: getString(body.profile_pic),
  };
  cache.set(senderId, profile);
  return profile;
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

async function fetchGraphPages(initialUrl: URL, accessToken: string) {
  const items: JsonRecord[] = [];
  let nextUrl: URL | null = initialUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < 100) {
    if (nextUrl.hostname !== "graph.facebook.com" || nextUrl.protocol !== "https:") {
      throw new Error("Meta returned an invalid pagination URL.");
    }
    nextUrl.searchParams.delete("access_token");
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

async function fetchMessagePages(messages: unknown, accessToken: string) {
  if (!isRecord(messages)) return [];

  const items: JsonRecord[] = Array.isArray(messages.data)
    ? messages.data.filter(isRecord)
    : [];
  const paging = isRecord(messages.paging) ? messages.paging : null;
  const firstNextPage = paging ? getString(paging.next) : null;
  let nextUrl: URL | null = firstNextPage ? new URL(firstNextPage) : null;
  let pageCount = 0;

  while (nextUrl && pageCount < 100) {
    if (nextUrl.hostname !== "graph.facebook.com" || nextUrl.protocol !== "https:") {
      throw new Error("Meta returned an invalid message pagination URL.");
    }
    nextUrl.searchParams.delete("access_token");
    const response = await fetch(nextUrl, {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(body) || isRecord(body.error)) {
      throw new Error(graphErrorMessage(body, response.status));
    }

    if (Array.isArray(body.data)) {
      items.push(...body.data.filter(isRecord));
    }
    const nextPaging = isRecord(body.paging) ? body.paging : null;
    const next = nextPaging ? getString(nextPaging.next) : null;
    nextUrl = next ? new URL(next) : null;
    pageCount += 1;
  }

  if (nextUrl) {
    throw new Error("Meta returned too many pages of Instagram messages.");
  }
  return items;
}

async function loadConversations(account: InstagramAccount, accessToken: string) {
  const version = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("META_GRAPH_API_VERSION must use the format vNN.N.");
  }

  // Instagram conversations are queried through the linked Facebook Page node.
  const conversationOwnerId = account.instagram_page_id;
  if (!conversationOwnerId) {
    throw new Error(
      "The connected account is missing its Facebook Page ID. Reconnect the account and try syncing again.",
    );
  }
  const url = new URL(
    `https://graph.facebook.com/${version}/${encodeURIComponent(conversationOwnerId)}/conversations`,
  );
  url.searchParams.set("platform", "instagram");
  url.searchParams.set(
    "fields",
    "id,participants,messages.limit(100){id,message,created_time,from,to,attachments}",
  );

  try {
    return await fetchGraphPages(url, accessToken);
  } catch (error) {
    console.error("Meta could not fetch Instagram Page conversations.", {
      accountId: account.id,
      error,
    });
    throw error;
  }
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
      .select("id, instagram_account_id, instagram_page_id, access_token_encrypted")
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
    const admin = createAdminClient();
    for (const account of accounts as InstagramAccount[]) {
      if (!account.access_token_encrypted) {
        throw new Error(`Connected Instagram account ${account.id} has no access token.`);
      }
      const accessToken = decryptPageAccessToken(account.access_token_encrypted);
      const conversations = await loadConversations(account, accessToken);
      const profileCache = new Map<string, SenderProfile>();
      const ownIds = new Set(
        [account.instagram_account_id, account.instagram_page_id].filter(
          (id): id is string => Boolean(id),
        ),
      );

      for (const conversation of conversations) {
        const conversationMessages = await fetchMessagePages(
          conversation.messages,
          accessToken,
        );
        let conversationHasMessages = false;

        for (const message of conversationMessages) {
          const externalId = getString(message.id);
          if (!externalId) continue;

          const fromId = getId(message.from);
          const toValue = message.to;
          const recipientIds = isRecord(toValue) && Array.isArray(toValue.data)
            ? toValue.data.map(getId).filter((id): id is string => Boolean(id))
            : [getId(toValue)].filter((id): id is string => Boolean(id));
          const participantIds = [
            fromId,
            ...recipientIds,
          ].filter((id): id is string => Boolean(id));
          const contactId = participantIds.find((id) => !ownIds.has(id));
          if (!contactId) continue;

          let profile: SenderProfile = {
            id: contactId,
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
            participantForId(conversation.participants, contactId) ??
            (getId(message.from) === contactId ? message.from : undefined);
          const senderName =
            profile.name ??
            (isRecord(contactProfile) ? getString(contactProfile.name) : null);
          const senderUsername =
            profile.username ??
            (isRecord(contactProfile) ? getString(contactProfile.username) : null);
          const username = senderUsername ?? senderName ?? contactId;
          const { data: contact, error: contactError } = await admin
            .from("contacts")
            .upsert(
              {
                ig_account_id: account.id,
                ig_scoped_user_id: contactId,
                sender_id: contactId,
                sender_name: senderName,
                sender_username: senderUsername,
                sender_avatar_url: profile.avatarUrl,
                username,
                last_interaction_at: getString(message.created_time) ?? new Date().toISOString(),
              },
              { onConflict: "ig_account_id,ig_scoped_user_id" },
            )
            .select("id")
            .single();
          if (contactError) throw contactError;

          const createdAt = getString(message.created_time);
          const messageText =
            extractMessageText(message) ?? "[Media/Image]";
          const direction =
            fromId && ownIds.has(fromId) ? "outbound" : "inbound";
          const { error: messageError } = await admin
            .from("conversations")
            .upsert(
              {
                contact_id: contact.id,
                direction,
                message_body: messageText,
                message_text: messageText,
                sender_id: contactId,
                sender_name: senderName,
                sender_username: senderUsername,
                sender_avatar_url: profile.avatarUrl,
                is_from_user: direction === "inbound",
                external_event_id: externalId,
                created_at: createdAt ?? new Date().toISOString(),
                metadata: {
                  source: "historical_sync",
                  instagram_account_id: account.instagram_account_id,
                  conversation_id: getString(conversation.id),
                },
              },
              {
                onConflict: "contact_id,external_event_id",
                ignoreDuplicates: true,
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
