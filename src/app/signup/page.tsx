'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .insert([{ name: workspaceName }])
          .select()
          .single()

        if (workspaceError) {
          console.error('Workspace creation failed:', workspaceError)
        } else if (workspaceData) {
          const { error: memberError } = await supabase.from('workspace_members').insert([
            {
              workspace_id: workspaceData.id,
              user_id: authData.user.id,
              role: 'admin',
            },
          ])

          if (memberError) {
            console.error('Workspace member creation failed:', memberError)
          }
        }
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while creating your account.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-8 shadow-xl border border-zinc-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-zinc-400">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-xl border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Get started with IgHouse
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="workspace"
                className="block text-sm font-medium text-zinc-300"
              >
                Workspace Name
              </label>
              <input
                id="workspace"
                name="workspace"
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2.5 pl-3 pr-10 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
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
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
