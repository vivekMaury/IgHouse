"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Camera,
  Zap,
  MessageCircle,
  Bot,
  ArrowRight,
  Shield,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.user) {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      setResetFeedback({
        type: 'error',
        message: 'Please enter your email address.',
      });
      return;
    }

    setResetLoading(true);
    setResetFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      });

      if (error) throw error;

      setResetFeedback({
        type: 'success',
        message: 'Password reset email sent! Check your inbox.',
      });
      setResetEmail('');
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err.message || 'Unable to send reset email. Please try again.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useTransform(x, [-0.5, 0.5], [10, -10]);
  const mouseYSpring = useTransform(y, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <>
      <div className="min-h-screen bg-[#030712] text-white overflow-hidden relative selection:bg-purple-500/30">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div
            className="absolute inset-0 bg-center opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: `40px 40px`,
              maskImage: `linear-gradient(to bottom, white, transparent)`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-between gap-8 px-4 pb-20 pt-16 sm:px-8 lg:flex-row lg:gap-12 lg:pt-20">
          <div className="w-full space-y-8 lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Bot className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-gray-300">Powered by AI & Meta Graph API</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-7xl"
            >
              Automate Instagram DMs & Turn Comments into <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Sales ⚡</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl text-base text-gray-400 sm:text-lg"
            >
              Scale your engagement on autopilot. Set up intelligent workflows to reply to followers and convert interactions into revenue.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/5">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-gray-200">Auto-DM Responses</span>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/5">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-gray-200">Comment-to-Lead</span>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/5">
                  <Camera className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-gray-200">Visual Flow Builder</span>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/5">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-gray-200">Safe & Compliant</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-4 pt-4"
            >
              <div className="flex -space-x-4">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[#030712] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shadow-lg"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                Join <span className="text-white font-semibold">1,000+</span> creators scaling today.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="flex w-full justify-center perspective-[1000px] lg:w-1/2"
          >
            <motion.div
              style={{ rotateX: mouseYSpring, rotateY: mouseXSpring }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full max-w-md transform-gpu"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-purple-500 to-pink-600 opacity-40 blur-lg transition duration-500" />

              <div className="relative p-8 bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">Get Started</h2>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        authMode === 'login' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        authMode === 'signup' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                  <div className="space-y-1 group">
                    <label className="text-sm font-medium text-gray-400 group-focus-within:text-purple-400 transition-colors">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all shadow-inner"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-400 group-focus-within:text-purple-400 transition-colors">
                        Password
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            setResetModalOpen(true);
                            setResetFeedback(null);
                          }}
                          className="text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all shadow-inner"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {authMode === 'login' ? 'Launch IgHouse' : 'Create Account'}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-gray-400 hover:text-white hover:underline transition-colors">
                    Terms of Service
                  </a>{' '}
                  &{' '}
                  <a href="#" className="text-gray-400 hover:text-white hover:underline transition-colors">
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#09090b] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Reset password</h3>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="Close reset password dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-zinc-400">
              Enter the email address associated with your account and we&apos;ll send a reset link.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label htmlFor="landing-reset-email" className="mb-1 block text-sm font-medium text-zinc-300">
                  Email address
                </label>
                <input
                  id="landing-reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>

              {resetFeedback && (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    resetFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {resetFeedback.message}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="flex w-full justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
