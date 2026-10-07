DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
CREATE POLICY "Users can view workspaces they belong to"
    ON workspaces FOR SELECT
    USING (
        is_workspace_member(id)
        OR owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create their own workspace" ON workspaces;
CREATE POLICY "Users can create their own workspace"
    ON workspaces FOR INSERT
    WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can join their own workspace" ON workspace_members;
CREATE POLICY "Users can join their own workspace"
    ON workspace_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND EXISTS (
            SELECT 1
            FROM workspaces
            WHERE workspaces.id = workspace_members.workspace_id
              AND (workspaces.owner_id IS NULL OR workspaces.owner_id = auth.uid())
        )
    );
