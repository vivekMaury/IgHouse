-- Migration: 20261005000000_workflows_schema.sql

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Workflow',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    flow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workflows
    ALTER COLUMN flow_data SET DEFAULT '{"nodes": [], "edges": []}'::jsonb;

CREATE INDEX IF NOT EXISTS workflows_workspace_id_idx
    ON workflows (workspace_id);

CREATE INDEX IF NOT EXISTS workflows_updated_at_idx
    ON workflows (updated_at DESC);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workflows in their workspaces" ON workflows;
CREATE POLICY "Users can view workflows in their workspaces"
    ON workflows FOR SELECT
    USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert workflows in their workspaces" ON workflows;
CREATE POLICY "Users can insert workflows in their workspaces"
    ON workflows FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update workflows in their workspaces" ON workflows;
CREATE POLICY "Users can update workflows in their workspaces"
    ON workflows FOR UPDATE
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can delete workflows in their workspaces" ON workflows;
CREATE POLICY "Users can delete workflows in their workspaces"
    ON workflows FOR DELETE
    USING (is_workspace_member(workspace_id));
