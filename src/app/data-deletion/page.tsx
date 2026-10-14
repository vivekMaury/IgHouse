import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  ExternalLink,
  KeyRound,
  MessageSquare,
  Lock,
} from "lucide-react";
import { CopyEmailButton } from "@/components/legal/copy-email-button";

export const metadata: Metadata = {
  title: "User Data Deletion Instructions | IgHouse",
  description:
    "Official Meta App Review compliant instructions for revoking IgHouse permissions and requesting complete deletion of your data from Supabase within 30 days.",
};

export default function DataDeletionPage() {
  const supportEmail = "info@ighouse.com";
  const mailtoLink = `mailto:${supportEmail}?subject=IgHouse%20Data%20Deletion%20Request&body=Hello%20IgHouse%20Team%2C%0A%0APlease%20permanently%20delete%20all%20data%20associated%20with%20my%20account%20from%20IgHouse%20and%20Supabase.%0A%0ARegistered%20Email%3A%20%0AInstagram%20Handle%3A%20%40%0AFacebook%20Page%20Name%20(if%20applicable)%3A%20%0A%0AThank%20you.`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500/20 selection:text-pink-300 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-pink-600/15 via-purple-600/15 to-transparent blur-3xl opacity-60 rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-red-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />
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
                Terms
              </Link>
              <Link
                href="/privacy-policy"
                className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-900 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/data-deletion"
                className="px-3 py-1.5 rounded-md bg-slate-800/60 text-white font-semibold border border-slate-700/60"
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

      {/* Main Content */}
      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 border-b border-slate-800/80 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-4">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Meta Platform Review Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
            User Data Deletion Instructions
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            In compliance with Meta Platform Terms, Instagram Developer Policies, and global data privacy standards
            (GDPR/CCPA), IgHouse provides simple, transparent methods for users to revoke app access and permanently delete
            all account data, direct messages, and credentials from our servers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Deletion Period: Max 30 Days
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Database className="w-3.5 h-3.5 text-pink-400" />
              Storage Engine: Supabase Cloud (Encrypted at Rest)
            </span>
          </div>
        </div>

        {/* Step-by-Step Instructions Container */}
        <div className="space-y-10">
          {/* STEP 1: Revoke Access */}
          <section className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-extrabold text-base shadow-sm">
                1
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Step One
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Remove IgHouse Access via Facebook &amp; Instagram Settings
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Revoking authorization disconnects the Meta Graph API tokens immediately and halts all automated messaging webhooks.
                </p>
              </div>
            </div>

            {/* Path navigation pill / box */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300">
                Primary Facebook Business Integration Removal Path:
              </p>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-pink-300 bg-pink-500/5 border border-pink-500/20 px-3 py-2.5 rounded-lg">
                <span className="font-semibold text-slate-200">Settings</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="font-semibold text-slate-200">Business Integrations</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="font-semibold text-pink-400">IgHouse</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="font-bold text-red-400">Remove</span>
              </div>
            </div>

            {/* Detailed Instructions for Facebook & Instagram */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-pink-400" />
                  Via Facebook (Desktop or Web)
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-xs leading-relaxed">
                  <li>Log in to your Facebook account associated with your Instagram Page.</li>
                  <li>Click your profile photo in the top right and select <strong className="text-slate-200">Settings &amp; privacy</strong> &gt; <strong className="text-slate-200">Settings</strong>.</li>
                  <li>In the left menu, select <strong className="text-slate-200">Business Integrations</strong> (or <em>Apps and Websites</em>).</li>
                  <li>Find <strong className="text-pink-300">IgHouse</strong> in the active list.</li>
                  <li>Click <strong className="text-red-400">Remove</strong> to revoke all Meta Graph API permissions.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Via Instagram App / Web
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-xs leading-relaxed">
                  <li>Open the Instagram app and navigate to your Profile page.</li>
                  <li>Tap the menu button (&equiv;) &gt; <strong className="text-slate-200">Settings and privacy</strong>.</li>
                  <li>Scroll to <strong className="text-slate-200">Website permissions</strong> &gt; <strong className="text-slate-200">Apps and websites</strong>.</li>
                  <li>Under the <strong className="text-slate-200">Active</strong> tab, locate <strong className="text-pink-300">IgHouse</strong>.</li>
                  <li>Tap <strong className="text-red-400">Remove</strong> to confirm revocation of all permissions.</li>
                </ol>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-3.5 text-xs text-slate-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Once revoked, IgHouse can no longer access your Instagram messages, profile details, or webhook triggers.
              </span>
            </div>
          </section>

          {/* STEP 2: Request Server Data Removal */}
          <section className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold text-base shadow-sm">
                2
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Step Two
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Request Complete Data Removal from IgHouse Servers
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Send an email request to trigger manual database wiping of all personal data, contact lists, and conversation histories.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              To request that all stored information associated with your account be completely and permanently expunged
              from IgHouse servers, please email our support team with your account details:
            </p>

            {/* Email Action Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800/90 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-400 font-medium">Send request to official support:</span>
                  <div className="font-mono text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-pink-400" />
                    <span>{supportEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={mailtoLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors shadow-sm shadow-pink-600/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Email Client</span>
                  </a>
                  <CopyEmailButton email={supportEmail} />
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-slate-200">
                  Please ensure your email includes the following details:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-300">Subject line:</strong> &quot;IgHouse Data Deletion Request&quot;
                  </li>
                  <li>
                    <strong className="text-slate-300">Registered Email:</strong> The email address used to create your IgHouse account.
                  </li>
                  <li>
                    <strong className="text-slate-300">Instagram Username:</strong> The connected handle(s) (e.g. <span className="font-mono text-pink-300">@yourbrand</span>).
                  </li>
                  <li>
                    <strong className="text-slate-300">Connected Facebook Page Name:</strong> (Optional, helps expedite verification).
                  </li>
                </ul>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  Note: Do not send your Instagram password or security codes. We will never ask for your account password.
                </p>
              </div>
            </div>
          </section>

          {/* STEP 3: Permanent Deletion from Supabase within 30 Days */}
          <section className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-base shadow-sm">
                3
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Step Three
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Permanent Data Deletion from Supabase within 30 Days
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Guaranteed permanent purging of all database rows, tokens, logs, and stored messages.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upon receipt of your deletion request and verification of account ownership, our engineering team initiates
              an automated purge sequence. Under Meta Platform Terms and our data governance standards:
            </p>

            {/* Scope of Deletion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  <span>DMs &amp; Conversations</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All stored conversations, direct messages, comment threads, lead answers, and customer replies are permanently wiped from <strong className="text-slate-200">Supabase</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Tokens &amp; Credentials</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All Meta OAuth access tokens, refresh tokens, page identifiers, webhook subscription records, and secrets are permanently destroyed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>30-Day SLA &amp; Backups</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permanent deletion is finalized within <strong className="text-slate-200">30 calendar days</strong>. Rolling database backups are purged on an encrypted retention cycle.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs sm:text-sm text-emerald-200/90 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300">Confirmation Notification:</span> Once the deletion from Supabase is fully executed, a confirmation email with a completion confirmation code is sent to your registered address for your compliance records.
              </div>
            </div>
          </section>

          {/* FAQ & Meta Review Compliance Note */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-pink-400" />
              Important Information About Deletion Requests
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white">Will requesting deletion affect my Instagram account?</h4>
                <p className="text-slate-400 mt-1">
                  No. Deletion only erases data stored inside IgHouse&apos;s Supabase infrastructure. Your Instagram profile, posts, followers, and native Instagram chat history in the Instagram app remain completely untouched.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white">Can I reconnect IgHouse later?</h4>
                <p className="text-slate-400 mt-1">
                  Yes. If you choose to use IgHouse again in the future, you can sign in and re-authorize the app at any time to start with a fresh, clean account.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white">Meta Data Deletion Callback URL Support</h4>
                <p className="text-slate-400 mt-1">
                  For automated Meta App Deletion callbacks, IgHouse complies with Meta&apos;s signed request endpoint protocols to generate automated deletion tracking codes for users removing apps via the Facebook App Dashboard.
                </p>
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
              Terms of Service
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
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
