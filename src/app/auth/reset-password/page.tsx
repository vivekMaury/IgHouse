'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const verifyResetSession = async () => {
      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else if (tokenHash && type === 'recovery') {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });

          if (otpError) {
            throw otpError;
          }
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('Your password reset link is invalid or has expired. Please request a new one.');
        }

        setIsReady(true);
      } catch (err: any) {
        setStatus({
          type: 'error',
          message: err?.message || 'This password reset link is invalid or expired. Please request a new one.',
        });
        setIsReady(false);
      }
    };

    void verifyResetSession();
  }, [searchParams, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setStatus({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({
        type: 'error',
        message: 'Passwords do not match.',
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      setStatus({
        type: 'success',
        message: 'Password updated successfully.',
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Unable to update your password right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            {status?.type === 'error' ? (
              <AlertCircle className="h-7 w-7 text-red-400" />
            ) : (
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            )}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Password reset</h1>
          <p className="mt-3 text-sm text-zinc-400">
            {status?.message || 'Checking your reset link...'}
          </p>

          {status?.type === 'error' && (
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Back to login
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">Set a new password</h1>
          <p className="mt-2 text-sm text-zinc-400">Choose a strong password to secure your account.</p>
        </div>

        {status && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-md border p-3 text-sm ${
              status.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-zinc-300">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2.5 pl-3 pr-10 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-zinc-300">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2.5 pl-3 pr-10 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
