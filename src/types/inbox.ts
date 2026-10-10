export interface Conversation {
  id: string;
  username: string;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  tags: string[];
  last_interaction_at: string | null;
}

export interface Message {
  id: string;
  contact_id: string;
  direction: "inbound" | "outbound";
  message_body: string;
  message_text?: string | null;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  is_from_user?: boolean | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  is_webhook_subscribed: boolean | null;
}
