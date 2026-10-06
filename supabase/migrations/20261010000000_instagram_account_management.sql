DROP POLICY IF EXISTS "Workspace members can connect Instagram accounts" ON ig_accounts;
CREATE POLICY "Workspace members can connect Instagram accounts"
    ON ig_accounts FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace members can update Instagram accounts" ON ig_accounts;
CREATE POLICY "Workspace members can update Instagram accounts"
    ON ig_accounts FOR UPDATE
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));
