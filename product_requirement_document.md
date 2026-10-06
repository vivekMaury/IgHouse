# Product Requirement Document (PRD) — IgHouse

## 1. Executive Summary
**IgHouse** is a high-end, 3D glassmorphic B2B SaaS platform for Instagram automation. It empowers creators, agencies, and e-commerce brands to turn Instagram comments and Direct Messages into automated lead generation and sales pipelines.

Using Meta Graph API, Edge Functions, Next.js 14, Supabase, and React Flow, IgHouse provides a visual drag-and-drop node environment to build complex conditional logic, comment-to-DM triggers, and automated conversation flows.

---

## 2. Core Vision & Objectives
* **Primary Objective**: Provide an intuitive, low-latency, and visual automation builder that converts Instagram engagement (comments, story mentions, DMs) into measurable leads and sales.
* **Target Audience**: Digital Marketers, E-Commerce Brand Owners, Content Creators, Agencies, and Social Media Managers.
* **Core Differentiator**: Modern 3D Glassmorphic UI/UX, extremely low latency via Supabase Edge Functions, strict compliance with Meta Graph API 24-hour messaging window, and visual node-based execution canvas.

---

## 3. Tech Stack & Architecture

### Tech Stack
* **Framework**: Next.js 14 (App Router, Server Actions, SSR)
* **Language**: TypeScript
* **Styling**: Tailwind CSS, Framer Motion (for 3D UI & Glassmorphic effects), Lucide React (Icons)
* **Database & Auth**: Supabase (PostgreSQL with Row Level Security, Auth SSR Middleware, Storage)
* **Visual Canvas**: `@xyflow/react` (React Flow)
* **Backend Infrastructure**: Supabase Edge Functions (Deno / TypeScript) for webhook handling
* **API Integration**: Meta Graph API (Instagram Messaging & Webhooks)

---

## 4. System Architecture & Workflows

### 4.1 High-Level Architecture Diagram
```
[Instagram User]
       │ (Comment / Story / DM)
       ▼
[Meta Graph API Webhook Engine]
       │
       ▼
[Supabase Edge Function: /instagram-webhook]
   ├── 1. Signature Verification (`X-Hub-Signature-256`)
   ├── 2. Workspace & Active Flow Lookup (JSON Matching)
   ├── 3. 24-Hour Window Validation
   └── 4. Send Graph API Response (DM / Quick Reply)
       │
       ▼
[IgHouse Supabase DB] ──► [Next.js 14 Live Dashboard Canvas]
```

### 4.2 Database Schema Architecture

#### Workspaces Table (`workspaces`)
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id TEXT UNIQUE,
  instagram_access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Workflows Table (`workflows`)
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'comment_keyword', 'story_mention', 'direct_dm'
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused'
  flow_data JSONB NOT NULL,    -- React Flow Canvas State (Nodes & Edges)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Automation Logs Table (`automation_logs`)
```sql
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  recipient_instagram_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'rate_limited'
  message_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Feature Requirements & Modules

### Phase 1: Authentication & Landing Experience
* **3D Glassmorphic Auth Page**: Combined landing page with dynamic 3D card tilt effects using Framer Motion.
* **Supabase SSR Auth Integration**: Login, Signup, and Password Reset capabilities using `@supabase/ssr`.
* **Password Visibility Toggle**: Interactive `Eye`/`EyeOff` icons for secure password entry.
* **Email Reset Flow**: Automated reset token links sent via Supabase Auth service.

### Phase 2: Dashboard & Workspaces
* **Responsive Sidebar & Mobile Drawer**: Collapsible menu adaptive across desktop, tablet, and smartphone screens.
* **Metrics Overview**:
  * Total DMs Sent
  * Comments Processed
  * Conversion Rate %
  * Active Automations Count
* **Account Connection**: Meta OAuth integration to connect Facebook Pages and associated Instagram Business Accounts.

### Phase 3: Visual Flow Builder (`/dashboard/flows/new`)
* **React Flow Canvas**: Infinite grid with zoom controls, mini-map, and drag-and-drop palette.
* **Custom Node Types**:
  1. ⚡ **Trigger Node**: Fires on specific triggers (`Comment Keyword`, `Story Mention`, `Direct DM`).
  2. 💬 **Message Node**: Handles text responses, dynamic quick replies, and CTA buttons.
  3. 🔀 **Condition Node**: Branching logic (`Is User Following Page?`, `Has Email Captured?`).
  4. ⏳ **Delay Node**: Configurable wait period (minutes/hours) before executing next step.
* **Flow Serialization**: Full Canvas state (Nodes, Edges, Custom Form Configs) saved directly into Supabase `workflows` table as `JSONB`.

### Phase 4: Meta Webhook & Edge Automation Engine
* **Verification Endpoint (`GET`)**: Handles Meta webhook challenge verification token (`hub.verify_token`).
* **Event Listener (`POST`)**:
  * Real-time listener for incoming Instagram comments and messages.
  * Validates Meta request headers using HMAC SHA256 signature verification.
  * Checks active flow JSON schemas to evaluate conditional paths and automatically dispatch DMs via Meta Graph API.
* **Compliance Safeguard**: Enforces 24-hour response window logic mandated by Meta Policy.

---

## 6. Non-Functional Requirements

### Performance & Latency
* Webhook response processing time under **500ms** via Edge Functions.
* Next.js pages optimized for Web Vitals (LCP < 1.5s, CLS < 0.05).

### Security
* Row Level Security (RLS) enabled on all Supabase tables.
* Access tokens encrypted in the database.
* Meta App Secret and API tokens stored strictly in backend environment variables.

### Responsiveness
* 100% Mobile-first responsive layout (Tailwind CSS breakpoints `sm`, `md`, `lg`, `xl`).

---

## 7. Development Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | Project Setup, Supabase Auth, 3D Landing Page | ✅ Completed |
| **Phase 2.1** | Dashboard Layout & Analytics Overview UI | ✅ Completed |
| **Phase 2.2** | React Flow Canvas Setup & Custom Node Palette | ✅ Completed |
| **Phase 2.3** | Custom Node Components (Trigger, Message, Condition, Delay) | 🔄 In Progress |
| **Phase 2.4** | Canvas Flow State Serialization & Supabase DB Integration | ⏳ Next Up |
| **Phase 3.1** | Meta Developer App & Webhook Setup | ⏳ Scheduled |
| **Phase 3.2** | Supabase Edge Function Engine (`instagram-webhook`) | ⏳ Scheduled |
| **Phase 4** | End-to-End Testing & Production Deployment | ⏳ Scheduled |