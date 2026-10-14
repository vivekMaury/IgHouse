import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Mail,
  CheckCircle2,
  Database,
  Eye,
  Server,
  Clock,
  Sparkles,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { CopyEmailButton } from "@/components/legal/copy-email-button";

export const metadata: Metadata = {
  title: "Privacy Policy | IgHouse",
  description:
    "Official Privacy Policy for IgHouse. Learn how we collect, encrypt, process, and protect your Instagram DM automation data, access tokens, and CRM records.",
};

export default function PrivacyPolicyPage() {
  const supportEmail = "info@ighouse.com";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500/20 selection:text-pink-300 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-pink-600/15 to-transparent blur-3xl opacity-60 rounded-full" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full" />
        <div className="absolute top-2/3 -left-40 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-pink-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 p-[1px] shadow-sm shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Shield className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-extrabold">
              IgHouse
            </span>
          </Link>

          {/* Nav links and Back button */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-400">
              <Link
                href="/terms"
                className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-900 transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="px-3 py-1.5 rounded-md bg-slate-800/60 text-white font-semibold border border-slate-700/60"
              >
                Privacy Policy
              </Link>
              <Link
                href="/data-deletion"
                className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-900 transition-colors"
              >
                Data Deletion
              </Link>
            </nav>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 hover:text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 border-b border-slate-800/80 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy &amp; Data Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            At IgHouse, your privacy and data security are fundamental to our mission. This Privacy Policy details how
            we access, process, store, and safeguard your account information, Instagram messaging interactions, and Meta Graph
            API tokens when you use our Instagram DM Automation and CRM services.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Last Updated: October 2026
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              AES-256 Token Encryption &bull; Meta Compliant
            </span>
          </div>

          {/* Key Privacy Highlights Card */}
          <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-950/30 to-pink-950/20 border border-purple-500/20 p-5 sm:p-6 text-sm text-slate-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-white">Our Core Privacy Commitments</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>We NEVER sell, rent, or trade your data.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Access tokens are encrypted at rest with AES-256.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Strict compliance with official Meta Developer Policies.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Permanent data deletion within 30 days on request.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Sections */}
        <div className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* 1. Information We Collect */}
          <section id="collection" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Information We Collect
              </h2>
            </div>
            <p>
              When you register for IgHouse and connect your Instagram Professional profile (Creator or Business account),
              we collect and process only the minimal information necessary to deliver our automation and CRM features:
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-pink-400" />
                  Account &amp; Authentication Information
                </h3>
                <p className="text-xs text-slate-400">
                  Your name, account email address, and encrypted credentials managed securely by our authentication system.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Instagram &amp; Meta Graph API Identifiers
                </h3>
                <p className="text-xs text-slate-400">
                  Instagram Business Account ID, connected Facebook Page ID, Instagram handle/username, and encrypted Page Access Tokens granted during OAuth authorization.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Interaction &amp; Webhook Data
                </h3>
                <p className="text-xs text-slate-400">
                  Incoming direct message events, user comment texts, story reply notifications, and keyword trigger logs needed in real-time to execute your configured automation rules.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              IgHouse never requests or accesses your personal Instagram password, personal payment card numbers, or private personal messages unrelated to your business automations.
            </p>
          </section>

          {/* 2. How We Use Information */}
          <section id="usage" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                How We Use Your Information
              </h2>
            </div>
            <p>We process your data strictly for legitimate operational purposes, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Executing Automation Workflows:</strong> Parsing incoming webhook triggers (comments, keyword DMs, story mentions) and delivering your pre-configured automated responses, digital download links, or lead capture questions.
              </li>
              <li>
                <strong className="text-white">Smart CRM Organization:</strong> Providing you with an organized multi-agent inbox, conversation tracking, contact lists, and funnel conversion stages inside your dashboard.
              </li>
              <li>
                <strong className="text-white">Security &amp; Abuse Prevention:</strong> Monitoring API rate limits, preventing spam or abuse, ensuring compliance with Meta platform rules, and protecting user accounts from unauthorized access.
              </li>
              <li>
                <strong className="text-white">Customer Support &amp; Communication:</strong> Responding to your support queries, troubleshooting automation configurations, and notifying you of critical system updates.
              </li>
            </ul>
            <p className="text-xs text-slate-400">
              We do not use your customers&apos; messages to train generalized public AI models, nor do we build advertising profiles based on your Instagram interaction histories.
            </p>
          </section>

          {/* 3. Meta Platform Policies & Graph API Compliance */}
          <section id="meta-compliance" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Meta Platform Policies &amp; Graph API Compliance
              </h2>
            </div>
            <p>
              IgHouse operates exclusively through the official Meta Graph API and Instagram Messaging Webhooks. In accordance with{" "}
              <a
                href="https://developers.facebook.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 underline decoration-pink-500/30 inline-flex items-center gap-1"
              >
                Meta Developer Policies <ExternalLink className="w-3 h-3" />
              </a>
              :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                We only request permissions strictly required to execute features you explicitly activate (such as <code className="text-pink-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded">instagram_manage_messages</code> and <code className="text-pink-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded">instagram_manage_comments</code>).
              </li>
              <li>
                All automated messaging responses abide by Meta&apos;s standard 24-hour messaging window.
              </li>
              <li>
                You retain the right to revoke IgHouse&apos;s API access at any moment directly inside your Facebook or Instagram settings.
              </li>
            </ul>
          </section>

          {/* 4. Token Storage, Encryption & Security */}
          <section id="security" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Token Storage, Encryption &amp; Security
              </h2>
            </div>
            <p>
              We enforce enterprise-grade data protection mechanisms across our infrastructure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>AES-256 Token Encryption</span>
                </div>
                <p className="text-xs text-slate-400">
                  Instagram Page access tokens and refresh secrets are encrypted at rest using AES-256-GCM prior to storage in Supabase PostgreSQL.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Server className="w-4 h-4" />
                  <span>In-Memory Webhook Handling</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tokens are only decrypted in volatile memory during real-time webhook execution and are never exposed to client-side browsers.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              All data transmitted between your browser, our servers, and Meta&apos;s endpoints is encrypted in transit using industry-standard TLS 1.3 / HTTPS protocols.
            </p>
          </section>

          {/* 5. Data Sharing & Third-Party Processors */}
          <section id="processors" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Data Sharing &amp; Third-Party Processors
              </h2>
            </div>
            <p>
              <strong className="text-white">IgHouse does not sell, rent, or monetize your personal or customer data.</strong> We only share information with trusted third-party infrastructure providers that perform essential operational services under strict data processing agreements:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Supabase Cloud:</strong> Encrypted PostgreSQL database hosting and user authentication infrastructure.
              </li>
              <li>
                <strong className="text-white">Upstash Redis:</strong> High-performance encrypted cache for rate limiting and webhook idempotency deduplication.
              </li>
              <li>
                <strong className="text-white">Meta Platforms, Inc.:</strong> Direct integration with official Meta Graph API servers to dispatch automated Instagram messages.
              </li>
            </ul>
          </section>

          {/* 6. Data Retention & Deletion Rights */}
          <section id="retention" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                6
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Data Retention &amp; Permanent Deletion Rights
              </h2>
            </div>
            <p>
              We retain account data and conversation logs only for as long as your account remains active or as needed to provide you with historical CRM metrics.
            </p>
            <p>
              You maintain the absolute right to request complete, permanent erasure of your data at any time. We have established dedicated, transparent instructions on our{" "}
              <Link
                href="/data-deletion"
                className="text-pink-400 underline decoration-pink-500/30 hover:text-pink-300 font-semibold"
              >
                User Data Deletion Instructions page
              </Link>
              . Upon receipt of a verified deletion request to{" "}
              <span className="font-mono text-pink-300">info@ighouse.com</span>, all stored messages, conversations, and access tokens are permanently purged from Supabase within <strong className="text-white">30 days</strong>.
            </p>
          </section>

          {/* 7. GDPR & CCPA User Rights */}
          <section id="rights" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                7
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Your Privacy Rights (GDPR &amp; CCPA)
              </h2>
            </div>
            <p>
              Regardless of where you reside, IgHouse honors fundamental privacy rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li><strong className="text-white">Right to Access:</strong> You may request a copy of the personal data we hold about your account.</li>
              <li><strong className="text-white">Right to Rectification:</strong> You may correct inaccurate or incomplete account details.</li>
              <li><strong className="text-white">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may request that we permanently delete your stored data.</li>
              <li><strong className="text-white">Right to Restrict or Object to Processing:</strong> You may revoke Instagram permissions at any time.</li>
            </ul>
          </section>

          {/* 8. Contact & Privacy Officer */}
          <section id="contact" className="scroll-mt-24 pt-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Privacy Inquiries &amp; Data Requests</h3>
                  <p className="text-xs text-slate-400">Direct contact for privacy, GDPR, and data protection questions</p>
                </div>
              </div>

              <p className="text-sm text-slate-300">
                To exercise any of your data privacy rights, ask questions about our data security practices, or submit a data deletion request, contact our privacy team directly:
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`mailto:${supportEmail}?subject=IgHouse%20Privacy%20Inquiry`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs sm:text-sm font-semibold hover:from-purple-500 hover:to-pink-400 transition-all shadow-md shadow-pink-500/20"
                >
                  <Mail className="w-4 h-4" />
                  <span>{supportEmail}</span>
                </a>
                <CopyEmailButton email={supportEmail} />
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Privacy team response window: Within 24–48 business hours</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-800/80 pt-8 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/data-deletion" className="hover:text-white transition-colors">
              Data Deletion
            </Link>
          </div>
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} IgHouse Inc. All rights reserved. Not affiliated with Meta Platforms, Inc.
          </p>
        </footer>
      </main>
    </div>
  );
}
