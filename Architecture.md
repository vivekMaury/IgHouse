Act as a Principal Full-Stack Engineer specializing in Next.js 14, Supabase, and Serverless Systems. 

We are building "IgHouse" — a high-performance Instagram Auto-DM and Conversational AI SaaS. We are using Supabase as our complete backend infrastructure (Database, Auth, Edge Functions, Realtime).

Please generate the complete project initialization structure, Supabase database migrations (SQL with RLS policies), type definitions, and the Meta Webhook Edge Function based on the following requirements:

---

### Tech Stack:
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Flow (@xyflow/react)
- Backend Infrastructure: Supabase (Postgres, Auth, Realtime, Storage)
- Serverless API Engine: Supabase Edge Functions (Deno / TypeScript)
- Database ORM / Client: `@supabase/supabase-js` (with auto-generated Database Types)
- Queue & Rate Limiting: Upstash Redis (HTTP REST client for Deno Edge Functions)
- External APIs: Meta Graph API (Instagram Messenger API), OpenAI API

---

### Step-by-Step Deliverables Needed Now:

1. Complete Directory Layout:
   - Provide a clean Next.js 14 + Supabase directory tree showing app routing, components, `supabase/migrations`, `supabase/functions`, and helper utilities.

2. Supabase SQL Database Migration Script (`supabase/migrations/20261004000000_init_schema.sql`):
   - `workspaces`: (`id`, `name`, `stripe_customer_id`, `created_at`)
   - `workspace_members`: Link `auth.users` to `workspaces` with roles (`owner`, `admin`, `member`).
   - `ig_accounts`: (`id`, `workspace_id`, `instagram_page_id`, `access_token_encrypted`, `username`)
   - `contacts`: (`id`, `ig_account_id`, `ig_scoped_user_id`, `username`, `email`, `phone`, `tags`, `last_interaction_at`)
   - `flows`: (`id`, `ig_account_id`, `trigger_type`, `nodes_json`, `is_active`, `updated_at`)
   - `conversations`: (`id`, `contact_id`, `direction`, `message_body`, `created_at`)
   - Enable Row Level Security (RLS) on ALL tables ensuring users can only read/write data belonging to their workspace.

3. Meta Webhook Supabase Edge Function (`supabase/functions/instagram-webhook/index.ts`):
   - Handle `GET` requests: Verify Meta's `hub.mode`, `hub.verify_token`, and return `hub.challenge`.
   - Handle `POST` requests:
     - Validate Meta `X-Hub-Signature-256` signature using `META_APP_SECRET`.
     - Push incoming webhook payloads immediately to Upstash Redis Queue (via REST API) for background processing.
     - Immediately return a `200 OK` response in < 200ms to avoid Meta retry/timeout penalties.

4. Asynchronous Queue Worker Function (`supabase/functions/process-webhook/index.ts`):
   - Background Edge Function triggered to consume jobs from Upstash Redis.
   - Parse Instagram comment/message payloads and update `contacts` & `conversations` using `@supabase/supabase-js` with Service Role Key.

5. Supabase Environment Setup (`.env.local` & `supabase/functions/.env`):
   - Define variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` (legacy: `META_VERIFY_TOKEN`), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

Provide production-grade, clean TypeScript code with detailed comments and step-by-step CLI execution commands (e.g., `supabase start`, `supabase db push`, `supabase functions deploy`).