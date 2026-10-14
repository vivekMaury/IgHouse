import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  FileText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Scale,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CopyEmailButton } from "@/components/legal/copy-email-button";

export const metadata: Metadata = {
  title: "Terms of Service | IgHouse",
  description:
    "Official Terms of Service for IgHouse Instagram DM Automation & CRM platform. Review user responsibilities, Meta compliance, and service terms.",
};

export default function TermsOfServicePage() {
  const supportEmail = "vivekmaury555@gmail.com";

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
                className="px-3 py-1.5 rounded-md bg-slate-800/60 text-white font-semibold border border-slate-700/60"
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
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            Welcome to IgHouse. These Terms of Service govern your access to and use of IgHouse’s
            Instagram DM automation, AI chat agent workflows, and CRM management platform. By creating an
            account or connecting your Instagram business profile, you enter into a legally binding agreement.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Last Updated: October 2026
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Official Meta Graph API Integration
            </span>
          </div>

          {/* Quick Notice Card */}
          <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-950/30 to-pink-950/20 border border-purple-500/20 p-5 sm:p-6 text-sm text-slate-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-white">Summary for Creators &amp; Businesses</h2>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  IgHouse operates strictly within Meta’s official Graph API and Instagram Messaging policies.
                  You retain complete ownership of your Instagram account and brand. In return, you agree to comply with
                  Instagram Community Guidelines, avoid unsolicited spam, and respect the standard 24-hour messaging window.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Sections */}
        <div className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section id="acceptance" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Acceptance of Terms
              </h2>
            </div>
            <p>
              By accessing, browsing, registering for, or utilizing any services provided by{" "}
              <strong className="text-white">IgHouse</strong> (&quot;IgHouse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              including our web dashboard, workflow builder, REST APIs, or webhook processors, you confirm that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>You have read, understood, and agreed to be legally bound by these Terms of Service.</li>
              <li>You have read and acknowledged our <Link href="/privacy-policy" className="text-pink-400 underline decoration-pink-500/30 hover:text-pink-300">Privacy Policy</Link> and <Link href="/data-deletion" className="text-pink-400 underline decoration-pink-500/30 hover:text-pink-300">Data Deletion Instructions</Link>.</li>
              <li>You are at least 18 years old or the age of legal majority in your jurisdiction.</li>
              <li>If you represent a business or corporate entity, you possess legal authority to bind that entity to these Terms.</li>
            </ul>
            <p className="text-slate-400 text-xs sm:text-sm">
              If you do not agree with any provision of these Terms, you must immediately discontinue use of IgHouse and disconnect any connected Meta accounts.
            </p>
          </section>

          {/* 2. Description of IgHouse Services */}
          <section id="services" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Description of IgHouse Services
              </h2>
            </div>
            <p>
              IgHouse is an all-in-one <strong className="text-white">Instagram Direct Message (DM) Automation and CRM platform</strong> engineered to help creators, digital brands, coaches, and e-commerce stores scale audience interactions effortlessly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm">
                  <Bot className="w-4 h-4" />
                  <span>Keyword &amp; Comment Triggers</span>
                </div>
                <p className="text-xs text-slate-400">
                  Automatically send customized DMs, resource links, and guides when users comment on your posts, reels, or live streams.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Smart Lead CRM</span>
                </div>
                <p className="text-xs text-slate-400">
                  Organize contacts, track conversation stages, segment prospects, and monitor sales funnels directly inside your IgHouse dashboard.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Story &amp; Mention Replies</span>
                </div>
                <p className="text-xs text-slate-400">
                  Instantly acknowledge story mentions and story replies to boost follower affinity and generate warm inbound leads.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Meta Verified Architecture</span>
                </div>
                <p className="text-xs text-slate-400">
                  Fully powered by the official Meta Graph API and Instagram Webhooks to ensure 100% account safety and compliance.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              IgHouse continuously enhances features. We reserve the right to update, modify, or deprecate specific features with reasonable notice to maintain platform reliability and Meta API alignment.
            </p>
          </section>

          {/* 3. Account Responsibilities & Meta/Instagram Compliance */}
          <section id="compliance" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Account Responsibilities &amp; Meta/Instagram Compliance
              </h2>
            </div>
            <p>
              To use IgHouse, you must connect an eligible Instagram Professional account (Creator or Business) linked to a verified Facebook Page. You acknowledge and strictly agree to the following obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 text-slate-300">
              <li>
                <strong className="text-white">Compliance with Meta Policies:</strong> You must strictly abide by{" "}
                <a
                  href="https://developers.facebook.com/terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline decoration-pink-500/30 inline-flex items-center gap-1"
                >
                  Meta Developer Policies <ExternalLink className="w-3 h-3" />
                </a>
                , the{" "}
                <a
                  href="https://help.instagram.com/477434105621119"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline decoration-pink-500/30 inline-flex items-center gap-1"
                >
                  Instagram Community Guidelines <ExternalLink className="w-3 h-3" />
                </a>
                , and Meta Platform Terms at all times.
              </li>
              <li>
                <strong className="text-white">Strict Anti-Spam Prohibition:</strong> You may not use IgHouse to send unsolicited commercial messages, aggressive bulk outreach, deceptive links, harassment, pyramid schemes, adult content, or any material that infringes intellectual property or privacy rights.
              </li>
              <li>
                <strong className="text-white">24-Hour Messaging Window:</strong> You must respect Meta’s standard messaging policies. Automated replies can only be dispatched in response to direct user interactions (such as a DM or a comment) within the permitted messaging window established by Meta APIs.
              </li>
              <li>
                <strong className="text-white">Security &amp; Credentials:</strong> You are responsible for preserving the confidentiality of your login credentials, API secrets, and two-factor authentication tokens. You accept complete responsibility for all automated messages, webhook events, and actions triggered through your account.
              </li>
              <li>
                <strong className="text-white">Authorization &amp; Consent:</strong> You guarantee that you have all necessary rights, licenses, and audience consent to dispatch messages and capture contact details through your connected Instagram profile.
              </li>
            </ul>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs sm:text-sm text-amber-200/90 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Zero Tolerance for Spam:</span> IgHouse reserves the right to immediately suspend or terminate any account found sending unsolicited spam, scraping user handles, or violating Meta rate limits, with no entitlement to a refund.
              </div>
            </div>
          </section>

          {/* 4. Limitation of Liability & Service Guarantees */}
          <section id="liability" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Limitation of Liability &amp; Service Guarantees
              </h2>
            </div>
            <p>
              IgHouse provides its software, servers, and integrations on an <strong className="text-white">&quot;AS IS&quot;</strong> and{" "}
              <strong className="text-white">&quot;AS AVAILABLE&quot;</strong> basis, without express or implied warranties of any kind.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">No Growth or Revenue Guarantees:</strong> While IgHouse provides powerful automation workflows, we do not guarantee specific sales outcomes, revenue figures, follower increases, or viral engagement. Results depend entirely on your marketing content and target audience.
              </li>
              <li>
                <strong className="text-white">Third-Party Platform Dependencies:</strong> IgHouse relies on the availability and responsiveness of Meta Platforms, Inc. (Instagram &amp; Facebook Graph APIs). We cannot be held liable for delivery delays, webhook drops, API outages, or policy changes enacted unilaterally by Meta.
              </li>
              <li>
                <strong className="text-white">Exclusion of Consequential Damages:</strong> To the maximum extent permitted by applicable law, IgHouse, its founders, and affiliates shall not be liable for any indirect, incidental, punitive, special, or consequential damages, including loss of profits, data corruption, or business interruption.
              </li>
              <li>
                <strong className="text-white">Cap on Monetary Liability:</strong> In no event shall IgHouse’s aggregate cumulative liability exceed the total amount actually paid by you to IgHouse during the twelve (12) month period immediately preceding the event giving rise to the claim.
              </li>
            </ul>
          </section>

          {/* 5. Subscriptions, Payments & Cancellations */}
          <section id="billing" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Subscriptions &amp; Cancellations
              </h2>
            </div>
            <p>
              IgHouse offers free tiers as well as premium paid subscription plans. By subscribing to a paid tier:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>You authorize our merchant payment processor to bill your payment method on a recurring monthly or annual basis until canceled.</li>
              <li>You may cancel your subscription at any time with a single click inside your account billing settings. Upon cancellation, you retain full access until the end of your prepaid billing period.</li>
              <li>Except where expressly required by law or specified under a promotional money-back guarantee, payments already processed are non-refundable.</li>
            </ul>
          </section>

          {/* 6. Data Rights & Termination */}
          <section id="termination" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
                6
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Data Rights, Deletion &amp; Termination
              </h2>
            </div>
            <p>
              You may terminate your account at any time. If you wish to revoke Instagram API access and permanently purge your stored conversation histories, message logs, and tokens, please follow our official{" "}
              <Link href="/data-deletion" className="text-pink-400 underline decoration-pink-500/30 hover:text-pink-300 font-semibold">
                User Data Deletion Instructions
              </Link>
              . Upon receipt of a verified deletion request, all personal and Instagram data stored in our Supabase database is permanently wiped within 30 days.
            </p>
          </section>

          {/* 7. Contact & Support Information */}
          <section id="contact" className="scroll-mt-24 pt-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Contact &amp; Support</h3>
                  <p className="text-xs text-slate-400">Questions regarding these terms or enterprise agreements</p>
                </div>
              </div>

              <p className="text-sm text-slate-300">
                If you have questions, feedback, or require legal clarifications concerning these Terms of Service, please reach out directly to our dedicated support email:
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`mailto:${supportEmail}?subject=IgHouse%20Terms%20Inquiry`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs sm:text-sm font-semibold hover:from-purple-500 hover:to-pink-400 transition-all shadow-md shadow-pink-500/20"
                >
                  <Mail className="w-4 h-4" />
                  <span>{supportEmail}</span>
                </a>
                <CopyEmailButton email={supportEmail} />
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Typical support response time: Within 24–48 business hours</span>
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
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
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
