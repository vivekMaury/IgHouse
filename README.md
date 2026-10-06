# IgHouse - Platform Architecture & Setup

## Directory Tree

```
IgHouse/
├── app/                  # Next.js 14 App Router
│   ├── (auth)/           # Auth pages (login/register)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── flows/        # React Flow canvas pages
│   │   ├── contacts/     # CRM views
│   │   └── settings/     # Workspace settings
│   ├── api/              # Next.js API Routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/           # UI Components
│   ├── ui/               # Shadcn UI components
│   ├── flow/             # React Flow custom nodes
│   └── shared/           # Shared layouts & elements
├── lib/                  # Utilities
│   └── supabase/         # Supabase client (browser/server/middleware)
├── supabase/
│   ├── functions/        # Deno Edge Functions
│   │   ├── instagram-webhook/ # Handles Meta verification & Upstash pushing
│   │   ├── process-webhook/   # Background worker for Upstash queue
│   │   └── .env               # Edge Functions secrets
│   ├── migrations/       # SQL Migrations
│   │   └── 20261004000000_init_schema.sql
│   └── config.toml       # Supabase local config
├── .env.local            # Next.js environment variables
├── package.json
└── tailwind.config.ts    # Tailwind CSS config
```

## Initialization & Testing Commands

To start the project and set up the local infrastructure, follow these commands in your terminal:

### 1. Initialize Next.js Project (If not already created)
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### 2. Initialize Shadcn UI & React Flow
```bash
npx shadcn-ui@latest init
npm install @xyflow/react @supabase/supabase-js @supabase/ssr
```

### 3. Initialize Supabase
```bash
supabase init
```

### 4. Start Local Supabase Stack
```bash
supabase start
```

### 5. Apply Migrations to Local DB
```bash
supabase db push
```

### 6. Serve Edge Functions Locally
To test the webhook edge functions locally (creates an ngrok-like tunnel on port 54321 usually):
```bash
supabase functions serve instagram-webhook --env-file ./supabase/functions/.env --no-verify-jwt
supabase functions serve process-webhook --env-file ./supabase/functions/.env --no-verify-jwt
```
> Note: The `instagram-webhook` should be accessed without JWT verification as it's triggered externally by Meta.

### 7. Run Next.js Dev Server
```bash
npm run dev
```

## Next Steps
- Expose your local environment via Ngrok to provide Meta with a valid `https` webhook URL pointing to `http://localhost:54321/functions/v1/instagram-webhook`.
- Set up a CRON job or pg_net request to trigger `process-webhook` continuously to process the Upstash queue.
