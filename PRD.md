# Product Requirements Document (PRD) — IgHouse

**Document Version:** 2.0.0  
**Status:** Approved for Development & Production Implementation  
**Product Name:** IgHouse  
**Category:** Instagram Automation, Visual Workflow Canvas & Conversational CRM SaaS  
**Last Updated:** October 2026  

---

## 1. Executive Summary

### 1.1 Vision
**IgHouse** transforms Instagram from a manual, high-friction direct message inbox into an automated, visual, and compliant sales and lead-generation engine. It bridges the gap between viral social media engagement and downstream revenue capture, enabling creators, e-commerce brands, and marketing agencies to convert comments, story mentions, and inbound DMs into qualified leads and sales 24/7.

### 1.2 Core Objectives
- **Instant Engagement**: Deliver sub-second automated responses to Instagram comments, story tags, and DMs.
- **Zero-Code Visual Builder**: Provide an intuitive drag-and-drop node canvas powered by `@xyflow/react` to orchestrate multi-step conversation funnels, follow-gates, delays, and lead captures.
- **Meta Policy Compliance**: Built strictly on Meta's official Messenger API for Instagram with mandatory 24-hour window enforcement, HMAC SHA-256 webhook signature verification, and automated token lifecycle management.
- **Unified Live CRM & Human Takeover**: A real-time inbox allowing operators to inspect conversation histories, monitor bot interactions, tag contacts, and seamlessly intervene with human messaging without workflow collisions.
- **Scalable Serverless Infrastructure**: Asynchronous queue decoupling via Upstash Redis and Supabase Edge Functions / Next.js serverless background workers to withstand viral comment surges without timeouts or API throttling.

---

## 2. Target Personas & Use Cases

| Persona | Pain Point | IgHouse Solution |
| :--- | :--- | :--- |
| **Creators & Micro-Influencers** | Manually DMing thousands of followers asking for lead magnets ("Comment 'LINK' for the guide"). | Comment-to-DM triggers that immediately deliver private links and automatically add a public comment reply. |
| **E-Commerce Brands & DTC** | High bounce rates from Instagram ads and lost conversions due to delayed customer support. | Automated product catalog exploration, discount code delivery, and abandoned cart recovery natively in DMs. |
| **Social Media & Funnel Agencies (SMMA)** | Managing multiple client accounts requires separate logins, fragmented tools, and high operational overhead. | Multi-tenant workspaces with role-based access control (Owner, Admin, Member), isolated Instagram connections, and automated CRM webhooks. |
| **Coaches, Consultants & Course Creators** | Qualifying leads through DMs is time-consuming and inconsistent. | Visual qualification flows with condition checks (e.g., follow status, email capture) before delivering high-value calendar booking links. |

---

## 3. Product Architecture & Technical Stack

### 3.1 Technology Stack
- **Web Framework**: Next.js 14 (App Router, Server Actions, Server Components, Route Handlers)
- **Programming Language**: TypeScript (strict type checking across database models, nodes, and APIs)
- **Styling & UI**: Tailwind CSS, Framer Motion (glassmorphic 3D styling), Lucide React
- **Visual Canvas**: `@xyflow/react` (React Flow) with customized nodes, handles, and mini-map
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) policies, `@supabase/ssr` Auth Middleware
- **Decoupled Queue & Throttling**: Upstash Redis (REST API) for sub-200ms webhook ingestion, FIFO event buffering, and distributed rate limiting
- **Background Worker**: Next.js Cron Route (`/api/cron/process-webhooks`) & Supabase Deno Edge Functions
- **External APIs**: Meta Graph API (Instagram Messenger API v21.0+), Google Apps Script / Google Sheets API, Custom Webhooks
- **Security & Cryptography**: Node.js `crypto` with `aes-256-gcm` for access token encryption, HMAC SHA-256 signature verification

### 3.2 High-Level System Architecture
```
                         ┌──────────────────────────────────────────────┐
                         │            Instagram Client / Meta           │
                         │    (Comment, Story Mention, Direct DM)       │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                │ Meta Webhook POST
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │   Meta Webhook Ingestion API Route           │
                         │   (/api/webhooks/instagram or Edge Function) │
                         │   - HMAC SHA-256 Signature Verification      │
                         │   - Immediate 200 OK (< 200ms ACK)           │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                │ LPUSH Event
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │         Upstash Redis FIFO Queue             │
                         │         (Rate Limiting & Deduplication)      │
                         └──────────────────────┬───────────────────────┘
                                                │
                                                │ RPOP Batch (Cron / Worker)
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │         Workflow Evaluation Engine           │
                         │            (src/lib/workflow-engine)         │
                         │   - Workspace & Active Flow Resolution       │
                         │   - Node Tree Traversal & Condition Logic    │
                         │   - Lead Extraction (Regex / Normalizer)     │
                         └──────────────┬──────────────────┬────────────┘
                                        │                  │
                Decrypted Token Graph DM│                  │ Supabase Sync
                                        ▼                  ▼
                         ┌────────────────────┐   ┌─────────────────────┐
                         │   Meta Graph API   │   │  Supabase Postgres  │
                         │  - Private DM      │   │  - captured_leads   │
                         │  - Comment Reply   │   │  - contacts & convs │
                         │  - Quick Replies   │   │  - automation_logs  │
                         └────────────────────┘   └──────────┬──────────┘
                                                             │ Realtime
                                                             ▼
                                                  ┌─────────────────────┐
                                                  │ Next.js 14 Dashboard│
                                                  │ - React Flow Canvas │
                                                  │ - Live Inbox & CRM  │
                                                  │ - Lead Integrations │
                                                  └─────────────────────┘
```

---

## 4. Detailed Feature Specifications

### 4.1 The Visual Flow Canvas (`/dashboard/flows`)
The visual editor allows non-technical users to build robust automation graphs with real-time validation and persistence.

#### Supported Node Types:
1. **Trigger Node (`trigger`)**:
   - **Trigger Events**:
     - `Comment Keyword`: Listens for comments on connected account posts, reels, or IGTV.
     - `Story Mention`: Fires when a user mentions or tags the business account in their Instagram story.
     - `Direct DM`: Fires on incoming direct messages.
   - **Matching Criteria**:
     - `Contains`: Keyword is part of the message/comment (case-insensitive).
     - `Exact Match`: Message matches keyword precisely.
     - `Starts With`: Message begins with the specified trigger keyword.
     - `All Comments`: Wildcard trigger for any incoming comment on designated posts.

2. **Message Node (`message` / `action`)**:
   - **Private DM**: Sends structured messages with dynamic variables (`{{username}}`).
   - **Public Comment Reply**: Randomly rotates multiple public comment replies (e.g., *"Sent to your DM! 📩"*, *"Check your inbox! ✨"*) to avoid Instagram spam filters.
   - **Interactive Elements**: Configurable quick-reply option chips and call-to-action buttons.
   - **Media Support**: Image and video attachment cards.

3. **Condition Node (`condition`)**:
   - Evaluates boolean conditions before permitting flow continuation:
     - `Is Follower`: Checks if sender follows the Instagram account (Follow-Gate).
     - `Has Contact Info`: Checks if email or phone is already captured in CRM.
     - `Has Tag`: Validates whether the contact has specific tags (e.g., `#VIP`, `#Lead`).
   - Provides split outputs: `Yes` (True) and `No` (False) branches.

4. **Delay Node (`delay`)**:
   - Pauses flow execution for a set duration (minutes or hours) before resuming.
   - Humanizes automation pace to prevent rapid-fire bot penalties from Meta.

5. **Lead Capture Node (`lead_capture`)**:
   - Intelligently parses incoming direct messages using regex pattern matching for email addresses and phone numbers.
   - Automatically stores captured data in the `captured_leads` and `contacts` database tables.
   - Dispatches lead notifications via configured workspace integrations (Webhooks & Google Sheets).

#### Canvas Capabilities:
- Interactive zoom, pan, snap-to-grid, and mini-map navigation.
- Node state serialization stored as JSONB (`flow_data: { nodes: [], edges: [] }`).
- Draft vs. Published status management with instant activation/pause toggles.

---

### 4.2 Webhook Ingestion & Decoupled Execution Pipeline
To ensure high reliability during viral traffic spikes, the webhook pipeline is fully decoupled from workflow execution.

1. **Meta Webhook Verification (`GET /api/webhooks/instagram`)**:
   - Validates `hub.mode === 'subscribe'` and compares `hub.verify_token` against `META_WEBHOOK_VERIFY_TOKEN`.
   - Returns raw `hub.challenge` integer with status 200 upon match.

2. **Event Ingestion & Signature Verification (`POST /api/webhooks/instagram`)**:
   - Validates Meta's `X-Hub-Signature-256` HTTP header using `META_APP_SECRET` and timing-safe comparison to prevent forgery.
   - Immediately enqueues the raw payload into Upstash Redis via `LPUSH` into `ighouse:webhooks:queue`.
   - Returns a `200 OK` response within `< 150ms` to satisfy Meta's strict timeout limits.

3. **Queue Processing Worker (`POST /api/cron/process-webhooks`)**:
   - Invoked via external cron trigger or Vercel Cron with `CRON_SECRET` authorization header.
   - Consumes queued batches via Upstash Redis `RPOP`.
   - **Deduplication Engine**: Keyed with Redis TTL (`ighouse:automation:dedupe:{workflow_id}:{event_id}`) to prevent double-firing on duplicate webhook deliveries.
   - **Rate Limiting**: Throttles rapid repetitive requests from identical senders via Redis TTL (`ighouse:automation:rate:{workflow_id}:{sender_id}`).
   - Automatically increments `workflows.execution_count` and logs status to `automation_logs`.

---

### 4.3 Live Inbox & Real-Time CRM (`/dashboard/inbox`)
A unified conversational dashboard allowing teams to monitor bot activity and perform manual interventions.

- **Conversation List**: Displays active chats sorted by `last_interaction_at`, showing sender avatar, username, unread indicators, and message snippet.
- **Real-Time Bidirectional Chat**: Subscribes to Supabase Realtime channel on `messages` table for zero-refresh message streaming.
- **Human Takeover Protocol**:
  - Outbound messages sent by human dashboard operators are tagged `is_from_user: false` and update the conversation state.
  - Automations can be paused for individual contacts to avoid automated replies clashing with a sales representative's active conversation.
- **Contact Tagging & CRM**:
  - Contact profile panel displaying captured email, phone number, Instagram Scoped ID, and tags (`#HotLead`, `#Interested`, `#Purchased`).
  - One-click tag assignment and removal.

---

### 4.4 Integrations & Data Export (`/dashboard/settings`)
Automations should never trap customer data in a silo. IgHouse provides native integrations:

1. **Custom Webhook Export**:
   - Dispatches a secure HTTPS `POST` payload (`event: 'lead.captured'`) to any third-party URL (Zapier, Make, custom CRM) with optional bearer token authorization.
2. **Google Sheets Export via Google Apps Script**:
   - Direct integration forwarding captured lead records (Instagram handle, email, phone, timestamp) directly to Google Spreadsheets.
   - Validated HTTPS redirects with strict domain whitelisting (`script.googleusercontent.com`).
3. **Encrypted Token Management**:
   - Meta Page access tokens are stored in the database encrypted via `aes-256-gcm` using `META_TOKEN_ENCRYPTION_KEY`.
   - Includes automatic long-lived token refresh logic before expiration.

---

### 4.5 Multi-Tenant Workspaces & RBAC
- **Workspaces Table (`workspaces`)**:
  - Each workspace represents an isolated business environment with its own Instagram connections, workflows, contacts, and integrations.
- **Workspace Memberships (`workspace_members`)**:
  - Multi-user collaboration with defined roles:
    - `owner`: Full control over billing, account deletion, and team invites.
    - `admin`: Can create/edit workflows, manage Instagram accounts, and edit integrations.
    - `member`: Access to Live Inbox, contacts CRM, and read-only workflow inspection.
- **Row Level Security (RLS)**:
  - Enabled across all PostgreSQL tables. Ensures team members can only access data belonging to workspaces they are explicitly linked to.

---

## 5. Non-Functional Requirements & Meta Compliance

### 5.1 Meta Platform Policy Compliance
- **Official Instagram Graph API**: Exclusively utilizes approved Meta endpoints (`/v21.0/me/messages`, `/v21.0/{comment_id}/replies`). No unofficial scraping or private API reversing.
- **24-Hour Messaging Window**: Automated responses are only dispatched within 24 hours of user-initiated inbound interaction. Outbound messages beyond 24 hours are blocked unless using approved message tags.
- **Data Deletion Compliance**: Implements compliant user data deletion instructions and callback endpoints at `/data-deletion`.
- **Public Legal Pages**: Published and linked `/privacy` and `/terms` pages fulfilling Meta App Review verification standards.

### 5.2 Performance & Reliability
- **Webhook Response SLA**: `< 200ms` response time for Meta inbound webhooks.
- **Throughput**: Queue architecture designed to absorb bursts of up to 10,000 comments/hour without dropped messages.
- **Availability**: High-availability serverless deployment across Vercel and Supabase.

### 5.3 Security & Privacy
- **Encryption at Rest**: Sensitive Meta tokens encrypted using AES-256-GCM.
- **Server-Side Validation**: All incoming Meta webhook payloads validated via HMAC SHA-256 signatures before being queued or processed.
- **Isolation**: Tenant data completely segregated via PostgreSQL Row Level Security (RLS).

---

## 6. Database Entity Relationship Overview

```
 ┌──────────────────────┐        ┌───────────────────────┐
 │      workspaces      │◄───────┤   workspace_members   │
 └──────────┬───────────┘        └───────────────────────┘
            │
            ├──────────────────────┬──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
 ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
 │  connected_accounts  │ │    workflows     │ │workspace_integrations│
 └──────────┬───────────┘ └────────┬─────────┘ └──────────────────────┘
            │                      │
            ├──────────────┐       ├──────────────────────┐
            ▼              ▼       ▼                      ▼
 ┌──────────────────┐ ┌────────────────────┐   ┌──────────────────────┐
 │     contacts     │ │  captured_leads    │   │   automation_logs    │
 └──────────┬───────┘ └────────────────────┘   └──────────────────────┘
            │
            ▼
 ┌──────────────────┐
 │  conversations   │
 └──────────┬───────┘
            │
            ▼
 ┌──────────────────┐
 │     messages     │
 └──────────────────┘
```

---

## 7. Monetization & Subscription Tiers

| Feature | Starter (Free) | Growth ($39/mo) | Pro ($119/mo) | Agency ($299/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **Contacts Limit** | 100 / month | 2,500 / month | 10,000 / month | Unlimited / Custom |
| **Active Workflows** | 2 | 10 | Unlimited | Unlimited |
| **Trigger Types** | Comment-to-DM | Comment + Story | All Triggers | All Triggers |
| **Lead Capture & Export**| Manual CSV | Webhooks | Webhooks + Sheets | Multi-Destination |
| **Live Inbox & CRM** | Basic | Included | Realtime + Tags | Realtime + Teams |
| **Workspaces & Seats** | 1 seat | 3 seats | 5 seats | Multi-Tenant Workspaces |
| **Watermark** | "Powered by IgHouse" | Removed | Removed | White-Label Portal |

---

## 8. Development Roadmap & Implementation Status

| Milestone | Scope & Deliverables | Status |
| :--- | :--- | :--- |
| **Milestone 1** | Next.js 14 App Router, Supabase Auth SSR, Landing Page & 3D Glassmorphic UI | ✅ Complete |
| **Milestone 2** | Supabase Master SQL Schema with RLS, Workspaces, Connected Accounts, Contacts | ✅ Complete |
| **Milestone 3** | React Flow Canvas Setup, Node Drag & Drop Palette, Workflow CRUD Server Actions | ✅ Complete |
| **Milestone 4** | Custom Canvas Node System (`TriggerNode`, `MessageNode`, `ConditionNode`, `DelayNode`, `LeadCaptureNode`) | ✅ Complete |
| **Milestone 5** | Meta Webhook Ingestion (`/api/webhooks/instagram`), HMAC SHA-256 Verification, Upstash Redis Queue | ✅ Complete |
| **Milestone 6** | Workflow Evaluation Engine (`src/lib/workflow-engine.ts`) with Token Decryption & Auto-Refresh | ✅ Complete |
| **Milestone 7** | Live Inbox UI with Realtime Chat, Contact Directory, and Manual Outbound DM Engine | ✅ Complete |
| **Milestone 8** | Lead Export Integrations (Custom Webhooks & Google Apps Script / Google Sheets) | ✅ Complete |
| **Milestone 9** | Meta Compliance, Legal Pages (`/privacy`, `/terms`, `/data-deletion`), and App Review Audit | ✅ Complete |
| **Milestone 10** | SaaS Billing Engine (Stripe/Razorpay subscription integration) & AI Setter Agents (LLM) | 🔄 Next Up |