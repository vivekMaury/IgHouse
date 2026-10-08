DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END;
$$;

DROP POLICY IF EXISTS "Workspace members can send inbox messages" ON public.conversations;
CREATE POLICY "Workspace members can send inbox messages"
    ON public.conversations FOR INSERT
    WITH CHECK (
        direction = 'outbound'
        AND EXISTS (
            SELECT 1
            FROM public.contacts
            JOIN public.ig_accounts
              ON public.ig_accounts.id = public.contacts.ig_account_id
            WHERE public.contacts.id = conversations.contact_id
              AND public.is_workspace_member(public.ig_accounts.workspace_id)
        )
    );
