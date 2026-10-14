# Product Requirement Document (PRD) — IgHouse

> **Notice:** This document is synchronized with the primary [PRD.md](file:///d:/IgHouse/PRD.md). For the executive summary, architecture, and feature roadmap, see below.

**Document Version:** 2.0.0  
**Status:** Approved for Production  
**Product Name:** IgHouse  
**Category:** Instagram Automation, Visual Workflow Canvas & Conversational CRM SaaS  
**Last Updated:** October 2026  

---

## 1. Executive Summary

### 1.1 Vision
**IgHouse** is a modern B2B SaaS platform for Instagram automation and lead generation. It enables creators, agencies, and e-commerce brands to turn Instagram comments, story mentions, and direct messages into automated, multi-step sales funnels.

### 1.2 Core Objectives
- **Instant Response Engine**: Automated, sub-second responses to Instagram engagement.
- **Visual Node Canvas**: Drag-and-drop workflow canvas built with `@xyflow/react` (React Flow) for designing conversation funnels, follow-gates, delays, and lead captures.
- **Meta Policy Compliance**: Built exclusively on Meta's official Messenger API for Instagram with 24-hour messaging window enforcement, HMAC SHA-256 signature verification, and automated token lifecycle management.
- **Live Inbox & CRM**: Unified real-time dashboard for monitoring conversations, contact tagging, and seamless human operator takeover.
- **Asynchronous Scalability**: High-throughput queue architecture using Upstash Redis to absorb viral comment surges without timeout penalties.

---

## 2. Technical Stack & Architecture

- **Web Framework**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Lucide React
- **Canvas Library**: `@xyflow/react` (React Flow)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS), `@supabase/ssr` Auth
- **Queue & Rate Limiting**: Upstash Redis (REST API) for sub-200ms webhook ingestion and FIFO queuing
- **Worker Engine**: Next.js Cron Route (`/api/cron/process-webhooks`) & Supabase Edge Functions
- **External APIs**: Meta Graph API (Instagram Messenger API v21.0+), Google Apps Script, Custom Webhooks
- **Security**: Node.js `crypto` with `aes-256-gcm` for token encryption, HMAC SHA-256 webhook signature validation

---

## 3. Visual Workflow Builder Nodes

The visual canvas supports 5 custom node types:

1. ⚡ **Trigger Node (`trigger`)**:
   - Supported triggers: `Comment Keyword`, `Story Mention`, `Direct DM`.
   - Match criteria: `Contains`, `Exact Match`, `Starts With`, `All Comments`.

2. 💬 **Message Node (`message` / `action`)**:
   - Automated private DMs with dynamic variables (`{{username}}`).
   - Public comment reply with randomized variations.
   - Quick-reply chips and call-to-action buttons.

3. 🔀 **Condition Node (`condition`)**:
   - Branching logic: `Is User Following Page?` (Follow-gate), `Has Email Captured?`, `Has Specific Tag?`.
   - Split outputs: `Yes` / `No`.

4. ⏳ **Delay Node (`delay`)**:
   - Configurable pauses (minutes or hours) before executing subsequent steps.

5. 🎯 **Lead Capture Node (`lead_capture`)**:
   - Regex-based extraction of email addresses and phone numbers from user messages.
   - Direct persistence to `captured_leads` table and immediate webhook/Google Sheets export.

---

## 4. Webhook Ingestion & Worker Pipeline

```
[Instagram Event] 
       │ 
       ▼ (Webhook POST)
[/api/webhooks/instagram]
  ├── Verify X-Hub-Signature-256 (HMAC SHA-256)
  ├── Immediately LPUSH payload to Upstash Redis
  └── Return 200 OK (< 200ms ACK)
       │
       ▼ (Cron / Asynchronous Worker)
[/api/cron/process-webhooks]
  ├── RPOP batch from Upstash Redis
  ├── Deduplicate via Redis TTL
  ├── Rate limit per sender
  ├── Execute Workflow Engine (src/lib/workflow-engine.ts)
  └── Dispatch Meta Graph API DMs / Replies
```

---

## 5. Live Inbox & Human Takeover Protocol

- **Conversation List**: Real-time list of all active Instagram chats with latest messages and unread badges.
- **Realtime Chat View**: Subscribes to Supabase Realtime on `messages` table.
- **Human Takeover**: Operator can send manual messages; marks conversation with human flag to prevent automated collision.
- **Lead Profile & Tagging**: Displays contact metadata, captured phone/email, and tags (`#HotLead`, `#Customer`).

---

## 6. Development Status & Roadmap

| Milestone | Deliverables | Status |
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