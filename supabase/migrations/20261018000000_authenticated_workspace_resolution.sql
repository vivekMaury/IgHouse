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

REVOKE ALL ON FUNCTION public.ensure_user_workspace(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_workspace(UUID) TO authenticated, service_role;
