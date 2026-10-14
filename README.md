# IgHouse — Instagram Automation & Conversational CRM SaaS

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-green?logo=supabase)](https://supabase.com/)
[![React Flow](https://img.shields.io/badge/React%20Flow-xyflow%2Freact-ff0072)](https://reactflow.dev/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis%20Queue-red?logo=redis)](https://upstash.com/)
[![Meta Graph API](https://img.shields.io/badge/Meta%20Graph%20API-v21.0-0081fb?logo=meta)](https://developers.facebook.com/)

**IgHouse** is a modern B2B SaaS platform for Instagram automation and lead generation. It empowers creators, e-commerce brands, and marketing agencies to turn Instagram comments, story mentions, and direct messages into automated, multi-step sales funnels.

Built with Next.js 14 App Router, Supabase, React Flow, and Upstash Redis, IgHouse delivers visual drag-and-drop workflow design, instant comment-to-DM triggers, a live CRM inbox with human takeover, and Meta Graph API compliance.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository & Install Dependencies](#1-clone-repository--install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Supabase Database Setup & Migrations](#3-supabase-database-setup--migrations)
  - [4. Run Local Development Server](#4-run-local-development-server)
- [Meta App Setup & Webhooks](#meta-app-setup--webhooks)
- [Background Queue & Worker Engine](#background-queue--worker-engine)
- [Database Schema Overview](#database-schema-overview)
- [Available Scripts](#available-scripts)
- [License & Documentation](#license--documentation)

---

## Key Features

### 1. Visual Flow Canvas (`@xyflow/react`)
- **Drag-and-Drop Editor**: Intuitive canvas with mini-map, pan/zoom, snap-to-grid, and edge routing.
- **5 Custom Node Types**:
  - ⚡ **Trigger Node**: Fires on Post/Reel comment keywords (`Contains`, `Exact Match`, `Starts With`), Story Mentions, or Direct DMs.
  - 💬 **Message Node**: Sends automated private DMs, randomized public comment replies, quick-reply chips, and call-to-action buttons.
  - 🔀 **Condition Node**: Branching logic evaluating follower status (Follow-Gate), contact details, or user tags.
  - ⏳ **Delay Node**: Configurable delays (minutes or hours) to pace messages naturally.
  - 🎯 **Lead Capture Node**: Regex-powered extraction of emails and phone numbers from user responses, directly synced to CRM.
- **Workflow State Management**: JSONB serialization with draft/published statuses and live activation toggles.

### 2. Live Inbox & Real-Time CRM
- **Real-Time Bidirectional Chat**: Supabase Realtime channel integration on `messages` table.
- **Human Takeover Protocol**: Operators can take over conversations and send manual DMs without colliding with automated flows.
- **Contact Directory**: Customer profile management displaying captured emails, phones, and custom tags (`#HotLead`, `#Customer`).

### 3. Decoupled Webhook Ingestion & Scalable Queue
- **Sub-200ms Acknowledgement**: Webhook endpoint immediately validates HMAC SHA-256 signatures and pushes payloads to an Upstash Redis FIFO queue, meeting Meta's strict response SLAs.
- **Deduplication & Rate Limiting**: Built-in Redis TTL guards prevent double-execution on duplicate webhooks and protect accounts from spam surges.
- **Asynchronous Execution Worker**: Background cron route (`/api/cron/process-webhooks`) and Edge Functions process queued events reliably.

### 4. Integrations & Data Export
- **Custom Webhooks**: Dispatches `lead.captured` events to any third-party HTTPS endpoint (Zapier, Make, custom CRMs).
- **Google Sheets Integration**: Forwards captured leads to Google Spreadsheets via Google Apps Script with validated redirect security.
- **Token Security**: Meta Page access tokens are encrypted in the database using `aes-256-gcm` with automatic token refresh handling.

### 5. Multi-Tenant Workspaces & Meta Compliance
- **Role-Based Access Control**: Multi-tenant workspaces with `owner`, `admin`, and `member` roles backed by PostgreSQL Row Level Security (RLS).
- **Strict Meta Compliance**: Official Instagram Graph API v21.0+, 24-hour messaging window enforcement, and data deletion callback (`/data-deletion`).

---

## System Architecture

```
[Instagram User Engagement]
  (Comment, Story Mention, Inbound DM)
              │
              ▼
    [Meta Graph API Webhook]
              │
              ▼ POST
    [/api/webhooks/instagram]
       ├── HMAC SHA-256 Signature Verification
       ├── Immediate LPUSH to Upstash Redis
       └── Return HTTP 200 OK (< 200ms)
              │
              ▼
    [Upstash Redis FIFO Queue]
              │
              ▼ Batch Consume (Cron / Worker)
    [/api/cron/process-webhooks]
       ├── Rate Limiting & Deduplication
       ├── Workflow Engine (src/lib/workflow-engine.ts)
       ├── Graph API DM / Reply Dispatch
       └── Lead Ingestion (captured_leads & workspace_integrations)
              │
              ▼
    [Supabase PostgreSQL + Realtime] ◄──► [Next.js 14 Dashboard UI]
```

---

## Project Directory Structure

```text
IgHouse/
├── src/
│   ├── app/                               # Next.js 14 App Router
│   │   ├── (auth)/                        # Authentication routes
│   │   │   ├── login/                     # Sign-in page
│   │   │   ├── signup/                    # Registration page
│   │   │   └── auth/                      # Callback & password reset
│   │   ├── dashboard/                     # Protected SaaS dashboard
│   │   │   ├── flows/                     # Flow list, creation & editor ([id])
│   │   │   ├── inbox/                     # Live Unified Inbox & CRM
│   │   │   ├── settings/                  # Workspaces, integrations & tokens
│   │   │   ├── layout.tsx                 # Dashboard sidebar & navigation
│   │   │   └── page.tsx                   # Metrics overview & analytics
│   │   ├── api/                           # Route Handlers
│   │   │   ├── auth/instagram/            # Meta OAuth flow & callback
│   │   │   ├── cron/process-webhooks/     # Background queue processor worker
│   │   │   ├── inbox/messages/            # Message fetch & manual DM dispatch
│   │   │   └── webhooks/instagram/        # Meta webhook verification & ingestion
│   │   ├── data-deletion/                 # Meta compliance data deletion callback
│   │   ├── privacy/                       # Public Privacy Policy
│   │   ├── terms/                         # Public Terms & Conditions
│   │   ├── layout.tsx                     # Root HTML layout & fonts
│   │   └── page.tsx                       # High-converting interactive landing page
│   ├── components/                        # Reusable React components
│   │   ├── canvas/nodes/                  # Custom React Flow nodes (Trigger, Message,
│   │   │                                  # Condition, Delay, LeadCapture)
│   │   ├── flows/                         # Flow builder sidebar & node palettes
│   │   ├── inbox/                         # ChatView, ConversationList, MessageInput
│   │   └── dashboard/                     # Connect Instagram buttons & cards
│   ├── lib/                               # Business logic & integrations
│   │   ├── automation/                    # Automation helpers
│   │   ├── instagram/api.ts               # Graph API calls, token encryption/refresh
│   │   ├── integrations/urls.ts           # URL & redirect validation
│   │   ├── queue/                         # Upstash Redis client & queue helpers
│   │   ├── supabase/admin.ts              # Service-role Supabase admin client
│   │   └── workflow-engine.ts             # Core node traversal & automation runner
│   ├── types/                             # TypeScript type definitions
│   ├── utils/supabase/                    # Supabase browser, server & middleware clients
│   └── middleware.ts                      # Session authentication & route protection
├── supabase/
│   ├── functions/                         # Supabase Deno Edge Functions
│   │   ├── instagram-webhook/             # Edge webhook listener
│   │   └── process-webhook/               # Edge queue worker
│   └── migrations/                        # PostgreSQL SQL migrations
│       └── 20261001000000_master_schema.sql # Master schema with RLS policies
├── PRD.md                                 # Product Requirements Document
├── Architecture.md                        # Technical architecture notes
├── tailwind.config.ts                     # Tailwind CSS styling configuration
└── package.json                           # Project dependencies and scripts
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Actions, SSR) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **Workflow Canvas** | [@xyflow/react](https://reactflow.dev/) (React Flow) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth SSR) |
| **Message Queue** | [Upstash Redis](https://upstash.com/) (Serverless REST client) |
| **Social API** | [Meta Graph API](https://developers.facebook.com/) (Instagram Messenger API v21.0+) |

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm** or **pnpm**
- **Supabase Account / CLI**: Cloud project or local Docker instance
- **Upstash Redis Database**: Serverless Redis database for webhook queueing
- **Meta for Developers Account**: An approved Facebook App with Instagram Graph API permissions

---

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/your-username/IgHouse.git
cd IgHouse
npm install
```

---

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate the required environment variables:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Upstash Redis (Webhook Queue & Throttling)
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token

# Meta for Developers / Instagram API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_VERIFY_TOKEN=your-custom-webhook-verify-token
META_WEBHOOK_VERIFY_TOKEN=your-custom-webhook-verify-token
INSTAGRAM_PAGE_ACCESS_TOKEN=your-page-access-token

# Token Security (32-character hexadecimal key for AES-256-GCM)
META_TOKEN_ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Cron Job Authorization
CRON_SECRET=your-secure-cron-secret
```

---

### 3. Supabase Database Setup & Migrations

The database schema includes workspaces, connected Instagram accounts, contacts, conversations, messages, workflows, logs, and Row Level Security (RLS) policies.

#### Apply the Master Migration:
If using Supabase CLI locally:
```bash
supabase db push
```

Or apply the SQL script directly via the Supabase Cloud SQL Editor:
- Navigate to your Supabase project dashboard > **SQL Editor**.
- Copy and run the contents of [`supabase/migrations/20261001000000_master_schema.sql`](file:///d:/IgHouse/supabase/migrations/20261001000000_master_schema.sql).

---

### 4. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page and navigate to `/dashboard` to access the application.

---

## Meta App Setup & Webhooks

To connect your Instagram account and receive real-time webhook events:

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/).
   - Create an app of type **Business**.
   - Add **Instagram Graph API** and **Facebook Login for Business**.

2. **Configure Required Permissions**:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `instagram_manage_comments`
   - `pages_manage_metadata`
   - `pages_show_list`

3. **Configure Webhook Subscription**:
   - In the Meta App Dashboard, navigate to **Webhooks** > **Instagram**.
   - Set **Callback URL**: `https://your-domain.com/api/webhooks/instagram` (or your Ngrok URL during local testing).
   - Set **Verify Token**: Must match your `META_WEBHOOK_VERIFY_TOKEN` in `.env.local`.
   - Subscribe to: `comments`, `messages`, `messaging_postbacks`, `message_reads`.

4. **Testing Webhooks Locally with Ngrok**:
   ```bash
   ngrok http 3000
   ```
   Provide the generated HTTPS forwarding URL to the Meta Webhook configuration:
   `https://<your-ngrok-subdomain>.ngrok-free.app/api/webhooks/instagram`

---

## Background Queue & Worker Engine

IgHouse prevents webhook drops and timeouts through its Upstash Redis FIFO queue.

1. **Ingestion**: When Meta sends an event, `/api/webhooks/instagram` checks the HMAC SHA-256 signature and performs an `LPUSH` into the Redis queue within 150ms.
2. **Processing**: To consume queued events, trigger the worker endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/cron/process-webhooks \
     -H "Authorization: Bearer your-secure-cron-secret"
   ```
3. **Scheduled Cron**:
   - Configure a recurring cron service (e.g., Vercel Cron or GitHub Actions) to call `/api/cron/process-webhooks` every minute.

---

## Database Schema Overview

| Table | Purpose |
| :--- | :--- |
| `workspaces` | Multi-tenant organization boundaries and plan tiers |
| `workspace_members` | Maps users to workspaces with roles (`owner`, `admin`, `member`) |
| `connected_accounts` / `ig_accounts` | Connected Meta Instagram Page credentials with encrypted tokens |
| `contacts` | CRM directory of Instagram leads with tags and interaction timestamps |
| `conversations` | Grouped chat threads with Instagram conversation identifiers |
| `messages` | Individual message records with Realtime streaming support |
| `workflows` | React Flow visual canvas definitions stored as JSONB |
| `automation_logs` | Audit trail of all matched, executed, and failed automation runs |
| `captured_leads` | Contact data (emails, phones) parsed from incoming conversations |
| `workspace_integrations` | Outbound destinations for leads (Custom Webhook & Google Sheets) |

---

## Available Scripts

```bash
# Run Next.js in development mode
npm run dev

# Build the production bundle
npm run build

# Start the production server
npm run start

# Run ESLint validation
npm run lint
```

---

## License & Documentation

- **Product Requirements Document**: See [PRD.md](file:///d:/IgHouse/PRD.md) for complete functional and non-functional specifications.
- **Architecture Notes**: See [Architecture.md](file:///d:/IgHouse/Architecture.md) for backend and infrastructure reference.
- **License**: Private & Proprietary — All rights reserved.
