'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Lock, X } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetFeedback, setResetFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while signing in.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedEmail = resetEmail.trim()

    if (!trimmedEmail) {
      setResetFeedback({
        type: 'error',
        message: 'Please enter your email address.',
      })
      return
    }

    setResetLoading(true)
    setResetFeedback(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      })

      if (error) {
        throw error
      }

      setResetFeedback({
        type: 'success',
        message: 'Password reset email sent! Check your inbox.',
      })
      setResetEmail('')
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err?.message || 'Unable to send reset email. Please try again.',
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-xl border border-zinc-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Email address
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => {
                      setResetEmail(email)
                      setResetModalOpen(true)
                      setResetFeedback(null)
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2.5 pl-10 pr-10 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Reset password</h3>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
                <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-zinc-300">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
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
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
