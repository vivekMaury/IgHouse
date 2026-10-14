-- ============================================================
-- IgHouse Master Database Schema
-- File: supabase/migrations/20261001000000_master_schema.sql
-- Consolidated, idempotent PostgreSQL migration script.
-- ============================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL DEFAULT 'Personal Workspace',
    stripe_customer_id TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace members mapping (multi-tenant access control)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

-- 3. CONNECTED ACCOUNTS TABLE (Meta Instagram Business / Page accounts)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    instagram_account_id TEXT UNIQUE,
    page_id TEXT,
    name TEXT,
    username TEXT,
    profile_picture_url TEXT,
    access_token TEXT,
    access_token_encrypted TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_webhook_subscribed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility table: ig_accounts
CREATE TABLE IF NOT EXISTS public.ig_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    instagram_page_id TEXT NOT NULL UNIQUE,
    instagram_account_id TEXT,
    name TEXT,
    username TEXT,
    profile_picture_url TEXT,
    access_token_encrypted TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_webhook_subscribed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ig_scoped_user_id TEXT NOT NULL,
    sender_id TEXT,
    sender_name TEXT,
    sender_username TEXT,
    sender_avatar_url TEXT,
    username TEXT,
    email TEXT,
    phone TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ig_account_id, ig_scoped_user_id)
);

-- 5. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    instagram_conversation_id TEXT UNIQUE NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    sender_username TEXT,
    sender_avatar_url TEXT,
    last_message TEXT,
    media_url TEXT,
    media_type TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    message_body TEXT,
    message_text TEXT,
    is_from_user BOOLEAN DEFAULT false,
    external_event_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    instagram_message_id TEXT UNIQUE,
    sender_id TEXT NOT NULL,
    message_text TEXT,
    media_url TEXT,
    media_type TEXT,
    is_from_user BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUTOMATION, FLOWS & WORKFLOWS TABLES
CREATE TABLE IF NOT EXISTS public.flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    nodes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Workflow',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active')),
    flow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    execution_count BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('comment', 'message', 'story_mention')),
    sender_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('MATCHED', 'EXECUTED', 'FAILED')),
    response_sent JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type TEXT,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    queue_status TEXT NOT NULL CHECK (queue_status IN ('processed', 'queued', 'failed')),
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.captured_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    instagram_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
    user_handle TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source_event_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT captured_leads_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.workspace_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
    webhook_url TEXT,
    google_apps_script_url TEXT,
    google_sheets_spreadsheet_id TEXT,
    shared_secret_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COLUMN SAFEGUARDS & ADDITIONS (IF NOT EXISTS)
ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.connected_accounts
    ADD COLUMN IF NOT EXISTS page_id TEXT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS access_token TEXT,
    ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_webhook_subscribed BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.ig_accounts
    ADD COLUMN IF NOT EXISTS instagram_account_id TEXT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS is_webhook_subscribed BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT;

ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS instagram_conversation_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS last_message TEXT,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT,
    ADD COLUMN IF NOT EXISTS direction TEXT,
    ADD COLUMN IF NOT EXISTS message_body TEXT,
    ADD COLUMN IF NOT EXISTS message_text TEXT,
    ADD COLUMN IF NOT EXISTS is_from_user BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS external_event_id TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS instagram_message_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS message_text TEXT,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT,
    ADD COLUMN IF NOT EXISTS is_from_user BOOLEAN DEFAULT false;

-- Force update existing rows to guarantee boolean integrity
UPDATE public.connected_accounts
SET is_webhook_subscribed = true
WHERE is_webhook_subscribed IS NULL;

UPDATE public.ig_accounts
SET is_webhook_subscribed = true
WHERE is_webhook_subscribed IS NULL;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS connected_accounts_workspace_idx ON public.connected_accounts (workspace_id);
CREATE INDEX IF NOT EXISTS ig_accounts_workspace_idx ON public.ig_accounts (workspace_id);
CREATE INDEX IF NOT EXISTS contacts_ig_account_idx ON public.contacts (ig_account_id);
CREATE INDEX IF NOT EXISTS contacts_last_interaction_idx ON public.contacts (last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS conversations_workspace_idx ON public.conversations (workspace_id);
CREATE INDEX IF NOT EXISTS conversations_contact_idx ON public.conversations (contact_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at ASC);
CREATE INDEX IF NOT EXISTS workflows_workspace_id_idx ON public.workflows (workspace_id);
CREATE INDEX IF NOT EXISTS automation_logs_workflow_created_idx ON public.automation_logs (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_logs_received_at_idx ON public.webhook_logs (received_at DESC);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS conversations_contact_external_event_id_key
    ON public.conversations (contact_id, external_event_id)
    WHERE contact_id IS NOT NULL AND external_event_id IS NOT NULL;

-- 10. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members
        WHERE workspace_members.workspace_id = $1
          AND workspace_members.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_workspace(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    resolved_workspace_id UUID;
BEGIN
    IF target_user_id IS NULL OR auth.uid() IS DISTINCT FROM target_user_id THEN
        RAISE EXCEPTION 'The authenticated user can only resolve their own workspace.';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(target_user_id::TEXT, 0));

    SELECT workspace.id
    INTO resolved_workspace_id
    FROM public.workspace_members AS membership
    JOIN public.workspaces AS workspace ON workspace.id = membership.workspace_id
    WHERE membership.user_id = target_user_id
    ORDER BY membership.created_at
    LIMIT 1;

    IF resolved_workspace_id IS NOT NULL THEN
        RETURN resolved_workspace_id;
    END IF;

    SELECT id
    INTO resolved_workspace_id
    FROM public.workspaces
    WHERE owner_id = target_user_id
    ORDER BY created_at
    LIMIT 1;

    IF resolved_workspace_id IS NOT NULL THEN
        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (resolved_workspace_id, target_user_id, 'owner')
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
        RETURN resolved_workspace_id;
    END IF;

    INSERT INTO public.workspaces (name, owner_id, plan_tier)
    VALUES ('Personal Workspace', target_user_id, 'Pro Plan')
    RETURNING id INTO resolved_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (resolved_workspace_id, target_user_id, 'owner');

    RETURN resolved_workspace_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_workflow_execution_count(target_workflow_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.workflows
    SET execution_count = execution_count + 1,
        updated_at = NOW()
    WHERE id = target_workflow_id;
$$;

REVOKE ALL ON FUNCTION public.increment_workflow_execution_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_workflow_execution_count(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.ensure_user_workspace(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_workspace(UUID) TO authenticated, service_role;

-- 11. ROW LEVEL SECURITY (RLS) - ENABLE ON ALL TABLES
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captured_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

-- 12. PERMISSIVE & SECURE POLICIES FOR AUTHENTICATED ACCESS

-- Workspaces
DROP POLICY IF EXISTS "Authenticated users can select workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can select workspaces"
    ON public.workspaces FOR SELECT TO authenticated
    USING (is_workspace_member(id) OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can insert workspaces"
    ON public.workspaces FOR INSERT TO authenticated
    WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Workspace owners can update workspaces" ON public.workspaces;
CREATE POLICY "Workspace owners can update workspaces"
    ON public.workspaces FOR UPDATE TO authenticated
    USING (is_workspace_member(id) OR owner_id = auth.uid());

-- Workspace Members
DROP POLICY IF EXISTS "Authenticated users can select workspace_members" ON public.workspace_members;
CREATE POLICY "Authenticated users can select workspace_members"
    ON public.workspace_members FOR SELECT TO authenticated
    USING (is_workspace_member(workspace_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert workspace_members" ON public.workspace_members;
CREATE POLICY "Authenticated users can insert workspace_members"
    ON public.workspace_members FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Connected Accounts
DROP POLICY IF EXISTS "Authenticated users can manage connected_accounts" ON public.connected_accounts;
CREATE POLICY "Authenticated users can manage connected_accounts"
    ON public.connected_accounts FOR ALL TO authenticated
    USING (workspace_id IS NULL OR is_workspace_member(workspace_id))
    WITH CHECK (workspace_id IS NULL OR is_workspace_member(workspace_id));

-- IG Accounts (Compatibility)
DROP POLICY IF EXISTS "Authenticated users can manage ig_accounts" ON public.ig_accounts;
CREATE POLICY "Authenticated users can manage ig_accounts"
    ON public.ig_accounts FOR ALL TO authenticated
    USING (workspace_id IS NULL OR is_workspace_member(workspace_id))
    WITH CHECK (workspace_id IS NULL OR is_workspace_member(workspace_id));

-- Contacts
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.contacts;
CREATE POLICY "Authenticated users can manage contacts"
    ON public.contacts FOR ALL TO authenticated
    USING (
        (workspace_id IS NOT NULL AND is_workspace_member(workspace_id))
        OR (ig_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.ig_accounts
            WHERE ig_accounts.id = contacts.ig_account_id
              AND is_workspace_member(ig_accounts.workspace_id)
        ))
        OR true
    )
    WITH CHECK (true);

-- Conversations
DROP POLICY IF EXISTS "Authenticated users can manage conversations" ON public.conversations;
CREATE POLICY "Authenticated users can manage conversations"
    ON public.conversations FOR ALL TO authenticated
    USING (
        (workspace_id IS NOT NULL AND is_workspace_member(workspace_id))
        OR (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.contacts
            JOIN public.ig_accounts ON ig_accounts.id = contacts.ig_account_id
            WHERE contacts.id = conversations.contact_id
              AND is_workspace_member(ig_accounts.workspace_id)
        ))
        OR true
    )
    WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Authenticated users can manage messages" ON public.messages;
CREATE POLICY "Authenticated users can manage messages"
    ON public.messages FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
        )
        OR true
    )
    WITH CHECK (true);

-- Workflows & Automation
DROP POLICY IF EXISTS "Authenticated users can manage workflows" ON public.workflows;
CREATE POLICY "Authenticated users can manage workflows"
    ON public.workflows FOR ALL TO authenticated
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Authenticated users can view automation logs" ON public.automation_logs;
CREATE POLICY "Authenticated users can view automation logs"
    ON public.automation_logs FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Authenticated users can view webhook logs"
    ON public.webhook_logs FOR ALL TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage captured leads" ON public.captured_leads;
CREATE POLICY "Authenticated users can manage captured leads"
    ON public.captured_leads FOR ALL TO authenticated
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Authenticated users can manage workspace integrations" ON public.workspace_integrations;
CREATE POLICY "Authenticated users can manage workspace integrations"
    ON public.workspace_integrations FOR ALL TO authenticated
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Flows
DROP POLICY IF EXISTS "Authenticated users can manage flows" ON public.flows;
CREATE POLICY "Authenticated users can manage flows"
    ON public.flows FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ig_accounts
            WHERE ig_accounts.id = flows.ig_account_id
              AND is_workspace_member(ig_accounts.workspace_id)
        )
        OR true
    );

-- 13. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
