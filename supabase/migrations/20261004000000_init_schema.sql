-- Migration: 20261004000000_init_schema.sql

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    plan_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: workspace_members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Table: ig_accounts
CREATE TABLE ig_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    instagram_page_id TEXT NOT NULL UNIQUE,
    username TEXT,
    access_token_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_account_id UUID REFERENCES ig_accounts(id) ON DELETE CASCADE,
    ig_scoped_user_id TEXT NOT NULL,
    username TEXT,
    email TEXT,
    phone TEXT,
    tags TEXT[],
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ig_account_id, ig_scoped_user_id)
);

-- Table: flows
CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_account_id UUID REFERENCES ig_accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- e.g., 'comment', 'dm_keyword', 'story_mention'
    nodes_json JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    message_body TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Helper Function
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = $1
        AND workspace_members.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policies (View policies added for brevity - expand for INSERT/UPDATE/DELETE as needed)
CREATE POLICY "Users can view workspaces they belong to" 
ON workspaces FOR SELECT 
USING (is_workspace_member(id));

CREATE POLICY "Users can view workspace members of their workspaces" 
ON workspace_members FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can view ig_accounts of their workspaces" 
ON ig_accounts FOR SELECT 
USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can view contacts of their workspaces" 
ON contacts FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM ig_accounts 
        WHERE ig_accounts.id = contacts.ig_account_id 
        AND is_workspace_member(ig_accounts.workspace_id)
    )
);

CREATE POLICY "Users can view flows of their workspaces" 
ON flows FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM ig_accounts 
        WHERE ig_accounts.id = flows.ig_account_id 
        AND is_workspace_member(ig_accounts.workspace_id)
    )
);

CREATE POLICY "Users can view conversations of their workspaces" 
ON conversations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM contacts
        JOIN ig_accounts ON ig_accounts.id = contacts.ig_account_id
        WHERE contacts.id = conversations.contact_id 
        AND is_workspace_member(ig_accounts.workspace_id)
    )
);
