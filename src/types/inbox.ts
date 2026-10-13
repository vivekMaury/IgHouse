export interface Conversation {
  id: string;
  workspace_id?: string | null;
  instagram_conversation_id?: string | null;
  username: string;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  last_message?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  tags?: string[];
  last_interaction_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id?: string | null;
  contact_id?: string | null;
  instagram_message_id?: string | null;
  direction?: "inbound" | "outbound";
  message_body: string;
  message_text?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar_url?: string | null;
  is_from_user?: boolean | null;
  created_at: string;
}

