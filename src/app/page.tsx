"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MessageCircle,
  MessageSquare,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Play,
  Check,
  TrendingUp,
  Users,
  Workflow,
  Inbox,
  Sparkles,
  BarChart3,
  CreditCard,
  Send,
  Heart,
  Share2,
  ExternalLink,
  Star,
  CheckCircle,
  Activity,
  Layers,
  Clock,
  Flame,
  MousePointerClick,
  FileText,
  HelpCircle,
} from "lucide-react";

// Inline brand SVGs since Lucide dropped third-party social brand icons
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function LandingPage() {
  // Mobile Nav State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // DM Simulator Interactive State
  const [simulatorTab, setSimulatorTab] = useState<"comment" | "dm" | "lead">("comment");
  const [customComment, setCustomComment] = useState("LINK");
  const [hasTriggered, setHasTriggered] = useState(true);

  // Pricing Interval Toggle
  const [isAnnual, setIsAnnual] = useState(true);

  // FAQ Accordion State (single or multiple active index)
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Legal Modal State
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | "refund" | null>(null);

  // Auto-cycle simulation if user is inactive (optional delightful touch)
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatorTab((prev) => {
        if (prev === "comment") return "dm";
        if (prev === "dm") return "lead";
        return "comment";
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white selection:bg-purple-500/30 selection:text-white relative overflow-x-hidden font-sans">
      {/* BACKGROUND GLOW BLOBS & GRID */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top left purple/indigo blob */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] animate-pulse" />
        {/* Top right pink/magenta blob */}
        <div className="absolute top-20 -right-20 w-[650px] h-[650px] bg-pink-600/15 rounded-full blur-[160px] animate-pulse delay-700" />
        {/* Mid center violet accent */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[180px]" />
        {/* Bottom cyan/blue blob */}
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />

        {/* Subtle geometric dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.25) 1px, transparent 1px)`,
            backgroundSize: `36px 36px`,
            maskImage: `radial-gradient(ellipse at center, white 40%, transparent 80%)`,
          }}
        />
      </div>

      {/* =========================================================================
          1. HEADER / STICKY NAVBAR
      ========================================================================== */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#090d16]/80 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[2px] shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
                <InstagramIcon className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-gray-300 bg-clip-text text-transparent">
                  IgHouse
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 tracking-wider">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Meta Automation Suite</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white hover:text-pink-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white hover:text-pink-400 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white hover:text-pink-400 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white hover:text-pink-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-xl group bg-gradient-to-br from-purple-600 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-[#090d16]/30 rounded-[10px] flex items-center gap-2 font-semibold">
                Get Started Free
                <ArrowRight className="w-4 h-4 text-pink-300 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-white/10 bg-[#0c101d] px-4 pt-3 pb-6 space-y-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-3 font-medium text-gray-200">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  FAQ
                </a>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =========================================================================
          2. HERO SECTION WITH LIVE INSTAGRAM SIMULATOR
      ========================================================================== */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Floating Trust Pill */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/15 backdrop-blur-md shadow-xl hover:border-pink-500/40 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-200">
              Official Meta Tech Partner &amp; 100% Anti-Ban Compliant
            </span>
          </motion.div>
        </div>

        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.12]"
          >
            Automate Instagram DMs &amp; Turn Every Comment into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-300">
              Instant Sales ⚡
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            The #1 Instagram DM Automation &amp; Live CRM platform built for Creators, E-commerce, and
            Agencies. Send links automatically, capture emails in DMs, and skyrocket conversions on autopilot.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 text-white font-bold text-base shadow-xl shadow-pink-600/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              Start Automating Free
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-base backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:border-white/20"
            >
              <Play className="w-4 h-4 text-pink-400 fill-pink-400" />
              Try Live Interactive Demo
            </a>
          </motion.div>

          {/* Micro trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs sm:text-sm text-gray-400"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-Day Free Unlimited Trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2-Minute Setup
            </span>
          </motion.div>
        </div>

        {/* =========================================================================
            INTERACTIVE INSTAGRAM DM SIMULATION SHOWCASE
        ========================================================================== */}
        <div id="interactive-demo" className="mt-16 lg:mt-24 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-purple-500/40 via-pink-500/20 to-transparent shadow-2xl">
            <div className="rounded-[22px] bg-[#0c111e]/95 backdrop-blur-2xl border border-white/10 p-4 sm:p-8 overflow-hidden">
              {/* Simulation Header with Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-lg font-bold text-white">Live Automation Simulator</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Click each step below to watch IgHouse capture leads in under 2 seconds.
                  </p>
                </div>

                {/* Step Toggle Buttons */}
                <div className="flex items-center bg-white/[0.05] p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatorTab("comment");
                      setHasTriggered(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      simulatorTab === "comment"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/25"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    1. Comment Trigger
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatorTab("dm");
                      setHasTriggered(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      simulatorTab === "dm"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/25"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    2. Auto DM Sent
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatorTab("lead");
                      setHasTriggered(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      simulatorTab === "lead"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/25"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    3. Lead Captured
                  </button>
                </div>
              </div>

              {/* Simulation Body Content */}
              <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Side: Mockup Preview Display */}
                <div className="lg:col-span-7">
                  <div className="relative mx-auto max-w-md rounded-2xl border border-white/10 bg-[#070a12] p-4 shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
                    {/* Phone Header Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                      </div>
                      <span className="font-semibold text-gray-300">
                        {simulatorTab === "comment" ? "@ighouse.brand Reel" : "Direct Message"}
                      </span>
                      <InstagramIcon className="w-4 h-4 text-pink-400" />
                    </div>

                    {/* Dynamic State Preview */}
                    <AnimatePresence mode="wait">
                      {simulatorTab === "comment" && (
                        <motion.div
                          key="comment-view"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.3 }}
                          className="py-4 space-y-4"
                        >
                          {/* Mini Post Header */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                              <div className="w-full h-full bg-[#090d16] rounded-full flex items-center justify-center font-bold text-xs text-pink-300">
                                IG
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-white">ighouse.brand</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                              </div>
                              <p className="text-[11px] text-gray-400">Viral Reel • 284k Views</p>
                            </div>
                          </div>

                          {/* Post Caption */}
                          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-gray-300">
                            🚀 Want our top 10 Instagram Growth Secrets &amp; E-commerce Playbook? Comment{" "}
                            <span className="text-pink-400 font-bold bg-pink-500/10 px-1.5 py-0.5 rounded">
                              &quot;{customComment}&quot;
                            </span>{" "}
                            below and we&apos;ll send it to your DMs instantly!
                          </div>

                          {/* Live Comment Stream */}
                          <div className="space-y-2.5 pt-2">
                            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                JD
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-200">johndoe_ai</span>
                                  <span className="text-[10px] text-gray-500">1s ago</span>
                                </div>
                                <p className="text-xs font-medium text-pink-400 mt-0.5">{customComment} 🔥</p>
                              </div>
                            </div>

                            {/* Trigger Detected Banner */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium"
                            >
                              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-bounce" />
                              <span>Keyword detected! Outbound DM dispatched in 0.8s ⚡</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {simulatorTab === "dm" && (
                        <motion.div
                          key="dm-view"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.3 }}
                          className="py-4 space-y-3"
                        >
                          {/* Chat DM Header */}
                          <div className="flex items-center justify-center text-center pb-2">
                            <div>
                              <p className="text-xs font-bold text-white flex items-center justify-center gap-1">
                                ighouse.brand
                                <CheckCircle2 className="w-3 h-3 text-blue-400 fill-blue-400" />
                              </p>
                              <p className="text-[10px] text-gray-400">Instagram Business • Verified</p>
                            </div>
                          </div>

                          {/* Outbound Automated Message Bubble */}
                          <div className="flex items-end gap-2 justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-purple-600 to-pink-600 p-3.5 text-white shadow-lg space-y-2">
                              <p className="text-xs leading-relaxed font-medium">
                                Hey John! 👋 Saw your comment on our Reel. Here is your direct VIP access link:
                              </p>

                              {/* Card Embed with Image */}
                              <div className="rounded-xl bg-black/40 border border-white/20 p-2.5 space-y-2">
                                <div className="h-24 w-full rounded-lg bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center text-xs font-bold text-pink-200">
                                  📘 IgHouse Growth Playbook 2026
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-gray-200">100% Free VIP Download</span>
                                  <span className="text-amber-400 font-bold">$99 VALUE</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSimulatorTab("lead")}
                                  className="w-full py-1.5 px-3 rounded-lg bg-white text-gray-950 font-bold text-xs hover:bg-gray-100 flex items-center justify-center gap-1.5 shadow"
                                >
                                  Claim My Free Playbook <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="text-[9px] text-pink-200/70 block text-right">Sent Just now • Delivered</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {simulatorTab === "lead" && (
                        <motion.div
                          key="lead-view"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.3 }}
                          className="py-6 space-y-4 text-center"
                        >
                          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-white">High-Intent Lead Captured!</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              User clicked link, verified their email, and converted.
                            </p>
                          </div>

                          {/* Lead Data Card */}
                          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-left space-y-2 text-xs">
                            <div className="flex justify-between items-center text-gray-300">
                              <span className="text-gray-400">Instagram Handle:</span>
                              <span className="font-semibold text-white">@johndoe_ai</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300">
                              <span className="text-gray-400">Captured Email:</span>
                              <span className="font-semibold text-pink-400">john@agencygrowth.com</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300">
                              <span className="text-gray-400">CRM Status:</span>
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Synced to Klaviyo / Zapier
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300 border-t border-white/5 pt-2">
                              <span className="text-gray-400">Order Attributed:</span>
                              <span className="font-bold text-amber-400">$149.00 (Stripe)</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Phone Bottom Footer Bar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Activity className="w-3 h-3" /> Live Meta Graph Webhook Active
                      </span>
                      <span>Latency: 180ms</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Controls & Explanation */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Experience It Yourself
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Never Miss a Warm Lead in Your Comments Again
                  </h3>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    When someone comments on your Reel or Post, every second counts. IgHouse detects the keyword
                    and delivers your product link, lead magnet, or discount code right to their Instagram DM before
                    they scroll away.
                  </p>

                  {/* Interactive Keyword Tester */}
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <label className="text-xs font-semibold text-gray-300 block">
                      Test with your custom keyword:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customComment}
                        onChange={(e) => setCustomComment(e.target.value.toUpperCase())}
                        maxLength={12}
                        className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-pink-500 flex-1"
                        placeholder="e.g. VIP, LINK, EBOOK"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatorTab("comment");
                          setHasTriggered(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" /> Test Flow
                      </button>
                    </div>
                  </div>

                  {/* Benefit Points */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Automates Reels, Feed Posts, Stories &amp; Instagram Live</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Dynamic link personalization with coupon code generator</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Syncs captured emails to HubSpot, Mailchimp, or Klaviyo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SOCIAL PROOF / STATS BANNER
      ========================================================================== */}
      <section className="relative z-10 py-12 border-y border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm font-semibold tracking-wider text-gray-400 uppercase mb-8">
            Trusted by 5,000+ High-Growth Creators, E-Commerce Brands &amp; Digital Agencies
          </p>

          {/* Brand Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-center opacity-70">
            {["GYMSHARK VIP", "BLOOMCHIC", "CREATORHUB", "HYPERSCALE", "VELVETSTUDIO", "BRANDMATRIX"].map(
              (brand, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center text-xs sm:text-sm font-bold tracking-widest text-gray-400 hover:text-white hover:border-pink-500/30 transition-all cursor-default"
                >
                  {brand}
                </div>
              )
            )}
          </div>

          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/5 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                15,000,000+
              </p>
              <p className="text-xs text-gray-400 font-medium">Automated DMs Delivered</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-400">
                98.4%
              </p>
              <p className="text-xs text-gray-400 font-medium">Average Instagram Open Rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                4.2x
              </p>
              <p className="text-xs text-gray-400 font-medium">Average ROI Increase</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                &lt; 2s
              </p>
              <p className="text-xs text-gray-400 font-medium">Instant Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CORE FEATURE SHOWCASE (GRID)
      ========================================================================== */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" /> Full-Funnel Instagram Arsenal
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Everything You Need to Turn DMs into a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Revenue Machine
            </span>
          </h2>
          <p className="text-base text-gray-400">
            Ditch clunky chatbots. IgHouse combines viral comment triggers, visual flow builders, and a live
            multi-agent inbox into one seamless command center.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-pink-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Auto Comment-to-DM Trigger</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Trigger instant automated DMs when followers comment specific keywords on your Reels, carousel
              posts, or Live videos. Includes public comment reply randomization.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-pink-400" /> Fuzzy keyword &amp; emoji matching
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-pink-400" /> Auto-hides spam or negative comments
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Inbox CRM &amp; Media Preview</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              All Instagram conversations synced in real-time. View customer photos with full lightbox preview,
              tag leads, add internal notes, and take over chats live.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> High-res photo &amp; story media viewer
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> Multi-agent assignments &amp; lead stages
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <Workflow className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Visual Node Flow Builder</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Build branching conversational flows with simple drag-and-drop nodes. Add delay timers, buttons,
              carousel cards, user conditions, and custom webhook actions.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400" /> 30+ pre-built high-converting templates
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400" /> A/B testing on DM sales pitches
              </li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Reply Agent &amp; Smart Answers</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Train an intelligent AI agent on your product catalog and FAQs. It handles pricing inquiries, sizing
              questions, and objections around the clock with human empathy.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Powered by GPT-4o with brand guardrails
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Smooth human-agent fallback handoff
              </li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics &amp; Revenue Attribution</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Track exactly how much revenue each Reel or Story generated. Monitor link click-through rates,
              message open rates, and customer acquisition costs in real-time.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> Shopify &amp; Stripe revenue integration
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> Post-by-post ROI leaderboards
              </li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="group relative rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-teal-500/40 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">100% Meta Compliant (No-Ban)</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              IgHouse connects directly via Meta’s official Graph API. No passwords stored, no browser scraping,
              no shadowbans, and 100% adherence to Instagram platform guidelines.
            </p>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400" /> Official Instagram Business OAuth
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400" /> Enterprise-grade SOC2 data encryption
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW IT WORKS (STEP-BY-STEP)
      ========================================================================== */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" /> 3 Simple Steps
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Launch Your First Flow in Under{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">
                3 Minutes
              </span>
            </h2>
            <p className="text-base text-gray-400">
              No technical expertise or coding needed. Follow our intuitive 3-step setup and start converting.
            </p>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative rounded-2xl bg-[#0d121f] border border-white/10 p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-extrabold text-xl border border-purple-500/30">
                01
              </div>
              <h3 className="text-xl font-bold text-white">Connect Your Instagram</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Log in via official Facebook / Instagram Business OAuth with one click. Your account permissions
                are encrypted and secured.
              </p>
              <div className="pt-2 text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Takes less than 45 seconds
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl bg-[#0d121f] border border-white/10 p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-extrabold text-xl border border-pink-500/30">
                02
              </div>
              <h3 className="text-xl font-bold text-white">Build Your Trigger &amp; Message</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Choose a trigger keyword (e.g. &quot;PRICE&quot; or &quot;LINK&quot;) and design the automated DM.
                Include images, buttons, and lead capture questions.
              </p>
              <div className="pt-2 text-xs text-pink-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-pink-400" /> 30+ pre-built templates included
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl bg-[#0d121f] border border-white/10 p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-xl border border-amber-500/30">
                03
              </div>
              <h3 className="text-xl font-bold text-white">Automate, Capture &amp; Profit</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Publish your Reel or Post. Sit back as incoming comments trigger instant DMs, capturing warm
                emails and closing sales 24 hours a day.
              </p>
              <div className="pt-2 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Real-time ROI analytics dashboard
              </div>
            </div>
          </div>

          {/* Quick CTA strip */}
          <div className="mt-16 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 transition-all"
            >
              Start Free Trial Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PRICING SECTION (MONTHLY / ANNUAL TOGGLE)
      ========================================================================== */}
      <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" /> Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Simple Plans That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-300">
              Scale With Your Growth
            </span>
          </h2>
          <p className="text-base text-gray-400">
            No surprise overage fees. Upgrade, downgrade, or cancel anytime with a single click.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-6 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${!isAnnual ? "text-white" : "text-gray-400"}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 rounded-full bg-white/10 border border-white/20 p-1 flex items-center transition-colors focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-md transform transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isAnnual ? "text-white" : "text-gray-400"}`}>
                Annual Billing
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                Save 25% + 2 Mo Free
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Free Starter */}
          <div className="rounded-3xl bg-[#0c101d] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Starter</h3>
                <p className="text-xs text-gray-400 mt-1">Perfect for new creators testing automation.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-gray-400">/ forever</span>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-gray-300">
                <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Included features:</p>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Up to 500 automated DMs / month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1 Instagram Business Account</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Basic Comment-to-DM Trigger</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Unified Live Inbox (7-day history)</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-500">
                  <X className="w-4 h-4" />
                  <span>No AI Auto-Reply Agent</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Tier 2: Pro Creator (Highlighted) */}
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-purple-500 via-pink-500 to-amber-500 shadow-2xl shadow-pink-500/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg">
              Most Popular 🔥
            </div>

            <div className="rounded-[22px] bg-[#0c111e] p-8 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Pro Creator
                    <Sparkles className="w-4 h-4 text-pink-400" />
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">For creators &amp; brands ready to scale sales.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    {isAnnual ? "$22" : "$29"}
                  </span>
                  <span className="text-xs text-gray-400">/ month {isAnnual && "(billed annually)"}</span>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-gray-300">
                  <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Everything in Starter, plus:</p>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span className="font-semibold text-white">15,000 automated DMs / month</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>3 Instagram Business Accounts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>AI Reply Agent (GPT-4o powered)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>Live Inbox CRM with Media Lightbox</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>Visual Drag-and-Drop Node Builder</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>Email &amp; Phone Lead Capture Forms</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-pink-400" />
                    <span>Priority 24/7 Live Chat Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start 14-Day Free Pro Trial <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Tier 3: Agency / Enterprise */}
          <div className="rounded-3xl bg-[#0c101d] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Agency &amp; Scale</h3>
                <p className="text-xs text-gray-400 mt-1">For agencies managing multiple client brands.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  {isAnnual ? "$79" : "$99"}
                </span>
                <span className="text-xs text-gray-400">/ month {isAnnual && "(billed annually)"}</span>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-gray-300">
                <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Everything in Pro, plus:</p>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Unlimited automated DMs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>15+ Connected Instagram Accounts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Multi-Seat Team Roles &amp; Permissions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Custom Webhooks &amp; Full REST API</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Dedicated Slack Channel &amp; Account Manager</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>White-Label Client ROI Reports</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                Contact Agency Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ ACCORDION SECTION
      ========================================================================== */}
      <section id="faq" className="relative z-10 py-24 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Got Questions?{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                We&apos;ve Got Answers.
              </span>
            </h2>
            <p className="text-base text-gray-400">
              Everything you need to know about setting up IgHouse and automating Instagram compliant with Meta.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {[
              {
                q: "Is IgHouse safe and compliant with Instagram's terms?",
                a: "Yes, 100%. IgHouse integrates exclusively through the official Meta Graph API using official Facebook Login. We never ask for your Instagram password, never use headless browser scrapers, and follow Meta's rate limits strictly to keep your account 100% safe from bans.",
              },
              {
                q: "Do I need an Instagram Business or Creator account?",
                a: "Yes. Meta's official Graph API requires your Instagram account to be set as a Business or Creator profile and connected to a Facebook Page. You can switch any personal profile to a Professional Creator account in the Instagram settings in 30 seconds for free.",
              },
              {
                q: "How does the Comment-to-DM automation trigger work?",
                a: "When you publish a Reel, Post, or Carousel, you can set a target keyword (e.g., 'LINK', 'BOOK', 'DISCOUNT'). When someone leaves a comment matching that keyword, IgHouse receives a secure real-time webhook and sends the pre-configured DM to that user within 1-2 seconds.",
              },
              {
                q: "Can multiple team members manage the Live Inbox simultaneously?",
                a: "Yes! On the Pro and Agency tiers, multiple agents can access the Live Inbox CRM, see incoming DMs in real time, view photo attachments in our lightbox, assign conversations, and respond manually without collision.",
              },
              {
                q: "Do I need a credit card to start the free trial?",
                a: "No credit card is required. You can sign up with your email, connect your Instagram account, and test all Pro features completely free for 14 days.",
              },
              {
                q: "What happens if I exceed my monthly automated DM limit?",
                a: "We never interrupt your active flows without warning. If you approach your limit, you will receive an in-app and email alert with the option to upgrade or keep standard handling.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#0d121f] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-base text-white">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 transition-transform ${
                      activeFaq === idx ? "rotate-180 text-pink-400 bg-pink-500/10" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CALL TO ACTION BANNER (PRE-FOOTER)
      ========================================================================== */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 shadow-2xl">
          <div className="rounded-[22px] bg-[#0c111e] p-8 sm:p-14 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Turn Your Instagram into an{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                Automated Sales Machine?
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Join over 5,000 creators and brands already scaling their revenue on autopilot. Get started free in 60
              seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2"
              >
                Start Free Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-base transition-all"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. COMPREHENSIVE FOOTER
      ========================================================================== */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#060911] text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-[2px]">
                  <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
                    <InstagramIcon className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">IgHouse</span>
              </Link>

              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                The next-generation Meta-compliant Instagram DM automation suite and conversational live inbox CRM.
                Turn every follower comment into qualified revenue.
              </p>

              {/* Social Media Links with Hover Glow */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/40 text-gray-400 hover:text-pink-400 flex items-center justify-center transition-all"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter / X"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-all"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-400 flex items-center justify-center transition-all"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-600/40 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-all"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Navigation Column 1: Product */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Product</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Comment-to-DM Trigger
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Live Inbox CRM
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Visual Flow Builder
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    AI Reply Agent
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </div>

            {/* Navigation Column 2: Resources & Company */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Resources</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Help &amp; Documentation
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <span className="text-gray-500">API Reference (v2)</span>
                </li>
                <li>
                  <span className="text-gray-500">Meta Compliance Whitepaper</span>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Customer Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Navigation Column 3: Legal & Compliance */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Legal &amp; Trust</p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal("refund")}
                    className="hover:text-white transition-colors text-left"
                  >
                    Refund Policy
                  </button>
                </li>
                <li>
                  <Link href="/data-deletion" className="hover:text-white transition-colors">
                    Data Deletion Instructions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright and System Status */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} IgHouse Inc. All rights reserved. Meta, Instagram, and Facebook are
              registered trademarks of Meta Platforms, Inc.
            </p>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational • 99.99% Uptime
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          10. INLINE LEGAL MODALS (PRIVACY / TERMS / REFUND)
      ========================================================================== */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl text-gray-300"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-bold text-white capitalize">
                    {legalModal === "privacy" && "Privacy Policy"}
                    {legalModal === "terms" && "Terms of Service"}
                    {legalModal === "refund" && "Refund & Cancellation Policy"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="py-4 space-y-4 text-xs sm:text-sm leading-relaxed">
                {legalModal === "privacy" && (
                  <>
                    <p>
                      At IgHouse, your privacy is paramount. We access your Instagram data exclusively via official
                      Meta Graph API tokens granted during your authorization.
                    </p>
                    <h4 className="font-bold text-white pt-2">1. Data We Collect</h4>
                    <p>
                      We collect basic profile information (such as your Instagram username and Page ID), incoming
                      message events, and comments solely to trigger the automations you configure. We never sell,
                      rent, or trade your data.
                    </p>
                    <h4 className="font-bold text-white pt-2">2. Token Storage &amp; Encryption</h4>
                    <p>
                      All access tokens are encrypted using AES-256 before storage in our secured PostgreSQL database.
                      Tokens are only decrypted in-memory during real-time webhook handling.
                    </p>
                    <h4 className="font-bold text-white pt-2">3. Data Deletion</h4>
                    <p>
                      You can disconnect your account and request complete deletion of all conversation logs and
                      lead metrics at any time by visiting our{" "}
                      <Link href="/data-deletion" className="text-pink-400 underline hover:text-pink-300">
                        Data Deletion page
                      </Link>{" "}
                      or contacting vivekmaury555@gmail.com.
                    </p>
                  </>
                )}

                {legalModal === "terms" && (
                  <>
                    <p>
                      By using IgHouse, you agree to comply with our Terms of Service as well as Instagram&apos;s
                      Community Guidelines and Meta Platform Terms.
                    </p>
                    <h4 className="font-bold text-white pt-2">1. Acceptable Use</h4>
                    <p>
                      IgHouse is designed to assist creators and businesses in providing value, answering customer
                      queries, and delivering requested links. Sending unsolicited spam, prohibited content, or
                      harassing messages is strictly prohibited and grounds for immediate termination.
                    </p>
                    <h4 className="font-bold text-white pt-2">2. Subscription &amp; Billing</h4>
                    <p>
                      Paid plans are billed on a recurring monthly or annual basis. You may cancel your subscription
                      at any time directly from the account settings, after which you retain access until the end of
                      your billing cycle.
                    </p>
                    <p className="pt-2 text-xs">
                      <Link href="/terms" className="text-pink-400 font-semibold underline hover:text-pink-300 inline-flex items-center gap-1">
                        Read full Terms of Service document &rarr;
                      </Link>
                    </p>
                  </>
                )}

                {legalModal === "refund" && (
                  <>
                    <p>
                      We stand behind the quality of IgHouse and offer a 100% risk-free experience with our 14-day
                      free trial before any billing occurs.
                    </p>
                    <h4 className="font-bold text-white pt-2">1. 14-Day Money Back Guarantee</h4>
                    <p>
                      If you are not completely satisfied with your first paid month of IgHouse Pro or Agency, contact
                      us within 14 days of your initial payment and we will issue a full refund, no questions asked.
                    </p>
                    <h4 className="font-bold text-white pt-2">2. Cancellation</h4>
                    <p>
                      You can cancel anytime in 1 click from your Dashboard. You will never be billed again once
                      cancelled.
                    </p>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
