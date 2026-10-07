CREATE TABLE IF NOT EXISTS captured_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    instagram_account_id UUID NOT NULL REFERENCES ig_accounts(id) ON DELETE CASCADE,
    user_handle TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source_event_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT captured_leads_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS captured_leads_event_idx
    ON captured_leads (instagram_account_id, source_event_id);

CREATE INDEX IF NOT EXISTS captured_leads_workspace_created_idx
    ON captured_leads (workspace_id, created_at DESC);

ALTER TABLE captured_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view captured leads" ON captured_leads;
CREATE POLICY "Workspace members can view captured leads"
    ON captured_leads FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE TABLE IF NOT EXISTS workspace_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    webhook_url TEXT,
    google_apps_script_url TEXT,
    google_sheets_spreadsheet_id TEXT,
    shared_secret_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace admins can manage integrations" ON workspace_integrations;
CREATE POLICY "Workspace admins can manage integrations"
    ON workspace_integrations FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM workspace_members
            WHERE workspace_members.workspace_id = workspace_integrations.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM workspace_members
            WHERE workspace_members.workspace_id = workspace_integrations.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin')
        )
    );
