-- ============================================================
-- IgHouse Master Schema (consolidated)
-- File: supabase/migrations/20261001000000_master_schema.sql
-- This single master file consolidates ALL historical fragment
-- migrations into one clean, idempotent definition. It is safe
-- to apply on a fresh database; every statement uses IF NOT EXISTS
-- / OR REPLACE / DROP-IF-EXISTS guards.
--
-- Canonical tables: workspaces, workspace_members, ig_accounts,
-- contacts, flows, conversations, workflows, automation_logs,
-- webhook_logs, captured_leads, workspace_integrations.
-- Compatibility projections:
--   public.connected_accounts (id, workspace_id, page_id,
--     instagram_account_id, is_webhook_subscribed, access_token,
--     is_active, created_at) over ig_accounts.
--   public.messages (id, conversation_id, instagram_message_id,
--     message_text, is_from_user, created_at) over conversations.
-- Live-inbox columns guaranteed:
--   conversations(instagram_conversation_id, sender_id, sender_name,
--     sender_username, sender_avatar_url, message_text,
--     is_from_user, last_message, external_event_id)
--   ig_accounts(page_id via instagram_page_id, instagram_account_id,
--     access_token via access_token_encrypted, is_webhook_subscribed)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'free',
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

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
    is_webhook_subscribed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
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

-- The legacy inbox stores one message per row in conversations. These fields
-- retain that contract while exposing Meta's thread ID and message preview.
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    message_body TEXT,
    message_text TEXT,
    sender_id TEXT,
    sender_name TEXT,
    sender_username TEXT,
    sender_avatar_url TEXT,
    is_from_user BOOLEAN,
    instagram_conversation_id TEXT,
    last_message TEXT,
    external_event_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Workflow',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    flow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    execution_count BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
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
    instagram_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
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

ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ig_accounts
    ADD COLUMN IF NOT EXISTS instagram_account_id TEXT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS is_webhook_subscribed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT;
ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS message_text TEXT,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS is_from_user BOOLEAN,
    ADD COLUMN IF NOT EXISTS instagram_conversation_id TEXT,
    ADD COLUMN IF NOT EXISTS last_message TEXT,
    ADD COLUMN IF NOT EXISTS external_event_id TEXT;
ALTER TABLE public.workflows
    ADD COLUMN IF NOT EXISTS execution_count BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

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

CREATE UNIQUE INDEX IF NOT EXISTS conversations_contact_external_event_id_key
    ON public.conversations (contact_id, external_event_id);
CREATE INDEX IF NOT EXISTS workflows_workspace_id_idx
    ON public.workflows (workspace_id);
CREATE INDEX IF NOT EXISTS workflows_updated_at_idx
    ON public.workflows (updated_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_workflow_created_idx
    ON public.automation_logs (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_user_created_idx
    ON public.automation_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_logs_received_at_idx
    ON public.webhook_logs (received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS captured_leads_event_idx
    ON public.captured_leads (instagram_account_id, source_event_id);
CREATE INDEX IF NOT EXISTS captured_leads_workspace_created_idx
    ON public.captured_leads (workspace_id, created_at DESC);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captured_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can view workspaces they belong to"
    ON public.workspaces FOR SELECT
    USING (is_workspace_member(id) OR owner_id = auth.uid());
DROP POLICY IF EXISTS "Users can create their own workspace" ON public.workspaces;
CREATE POLICY "Users can create their own workspace"
    ON public.workspaces FOR INSERT
    WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view workspace members of their workspaces" ON public.workspace_members;
CREATE POLICY "Users can view workspace members of their workspaces"
    ON public.workspace_members FOR SELECT
    USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Users can join their own workspace" ON public.workspace_members;
CREATE POLICY "Users can join their own workspace"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND EXISTS (
            SELECT 1
            FROM public.workspaces
            WHERE workspaces.id = workspace_members.workspace_id
              AND (workspaces.owner_id IS NULL OR workspaces.owner_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view ig_accounts of their workspaces" ON public.ig_accounts;
CREATE POLICY "Users can view ig_accounts of their workspaces"
    ON public.ig_accounts FOR SELECT
    USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Workspace members can connect Instagram accounts" ON public.ig_accounts;
CREATE POLICY "Workspace members can connect Instagram accounts"
    ON public.ig_accounts FOR INSERT
    WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Workspace members can update Instagram accounts" ON public.ig_accounts;
CREATE POLICY "Workspace members can update Instagram accounts"
    ON public.ig_accounts FOR UPDATE
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can view contacts of their workspaces" ON public.contacts;
CREATE POLICY "Users can view contacts of their workspaces"
    ON public.contacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.ig_accounts
            WHERE ig_accounts.id = contacts.ig_account_id
              AND is_workspace_member(ig_accounts.workspace_id)
        )
    );

DROP POLICY IF EXISTS "Users can view flows of their workspaces" ON public.flows;
CREATE POLICY "Users can view flows of their workspaces"
    ON public.flows FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.ig_accounts
            WHERE ig_accounts.id = flows.ig_account_id
              AND is_workspace_member(ig_accounts.workspace_id)
        )
    );

DROP POLICY IF EXISTS "Users can view conversations of their workspaces" ON public.conversations;
CREATE POLICY "Users can view conversations of their workspaces"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.contacts
            JOIN public.ig_accounts ON ig_accounts.id = contacts.ig_account_id
            WHERE contacts.id = conversations.contact_id
              AND is_workspace_member(ig_accounts.workspace_id)
        )
    );
DROP POLICY IF EXISTS "Workspace members can send inbox messages" ON public.conversations;
CREATE POLICY "Workspace members can send inbox messages"
    ON public.conversations FOR INSERT
    WITH CHECK (
        direction = 'outbound'
        AND EXISTS (
            SELECT 1
            FROM public.contacts
            JOIN public.ig_accounts ON ig_accounts.id = contacts.ig_account_id
            WHERE contacts.id = conversations.contact_id
              AND is_workspace_member(ig_accounts.workspace_id)
        )
    );

DROP POLICY IF EXISTS "Users can view workflows in their workspaces" ON public.workflows;
CREATE POLICY "Users can view workflows in their workspaces"
    ON public.workflows FOR SELECT
    USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Users can insert workflows in their workspaces" ON public.workflows;
CREATE POLICY "Users can insert workflows in their workspaces"
    ON public.workflows FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Users can update workflows in their workspaces" ON public.workflows;
CREATE POLICY "Users can update workflows in their workspaces"
    ON public.workflows FOR UPDATE
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Users can delete workflows in their workspaces" ON public.workflows;
CREATE POLICY "Users can delete workflows in their workspaces"
    ON public.workflows FOR DELETE
    USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can view their automation logs" ON public.automation_logs;
CREATE POLICY "Users can view their automation logs"
    ON public.automation_logs FOR SELECT
    USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Workspace members can view captured leads" ON public.captured_leads;
CREATE POLICY "Workspace members can view captured leads"
    ON public.captured_leads FOR SELECT
    USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Workspace admins can manage integrations" ON public.workspace_integrations;
CREATE POLICY "Workspace admins can manage integrations"
    ON public.workspace_integrations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = workspace_integrations.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = workspace_integrations.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin')
        )
    );

-- Compatibility views expose the requested normalized names without duplicating
-- encrypted account tokens or the existing inbox message records.
CREATE OR REPLACE VIEW public.connected_accounts
WITH (security_invoker = true)
AS
SELECT
    id,
    workspace_id,
    instagram_page_id AS page_id,
    instagram_account_id,
    is_webhook_subscribed,
    access_token_encrypted AS access_token,
    is_active,
    created_at
FROM public.ig_accounts;

CREATE OR REPLACE VIEW public.messages
WITH (security_invoker = true)
AS
SELECT
    id,
    contact_id AS conversation_id,
    external_event_id AS instagram_message_id,
    COALESCE(message_text, message_body) AS message_text,
    COALESCE(is_from_user, direction = 'inbound') AS is_from_user,
    created_at
FROM public.conversations;

COMMENT ON VIEW public.connected_accounts IS
    'Compatibility projection over ig_accounts; access_token contains the encrypted Page token.';
COMMENT ON VIEW public.messages IS
    'Compatibility projection over the legacy per-message conversations table.';
