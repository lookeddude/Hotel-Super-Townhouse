'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { loginSchema, type LoginValues } from '@/lib/validations/authSchema';
import { signInWithEmail, isAdminRole, type UserRole } from '@/lib/supabase/auth';
import { useSupabase } from '@/providers/SupabaseProvider';
import { ROUTES } from '@/constants/routes';

// ─── Inner form (uses useSearchParams — must be inside Suspense) ───────────────

function LoginFormInner() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const getRedirectPath = (role: UserRole): string => {
    if (nextPath) return nextPath;
    return isAdminRole(role) ? ROUTES.adminDashboard : ROUTES.dashboard;
  };

  const onSubmit = async (values: LoginValues) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(supabase, values.email, values.password);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success('Welcome back!');
      router.push(getRedirectPath(result.data.role));
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl mb-4">
          ST
        </div>
        <h1 className="font-heading text-headline-md text-on-surface">Welcome Back</h1>
        <p className="text-sm text-on-surface-variant mt-1">Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-label-md text-on-surface">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            disabled={isSubmitting}
            {...register('email')}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
              errors.email
                ? 'border-error focus:border-error'
                : 'border-outline-variant focus:border-on-surface'
            }`}
          />
          {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-label-md text-on-surface">
              Password
            </label>
            <Link href={ROUTES.forgotPassword} className="text-caption text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isSubmitting}
              {...register('password')}
              className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
                errors.password
                  ? 'border-error focus:border-error'
                  : 'border-outline-variant focus:border-on-surface'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <label htmlFor="remember-me" className="text-sm text-on-surface-variant cursor-pointer">
            Remember me
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-2 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-caption text-outline">or continue with</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Google */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={async () => {
          const { createBrowserClient } = await import('@supabase/ssr');
          const client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          await client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}
        className="w-full py-2.5 border border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span className="font-bold text-base">G</span>
        Sign in with Google
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-on-surface-variant mt-6">
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.register} className="text-primary font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

// ─── Page wrapper — Suspense required for useSearchParams ─────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2 flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          }
        >
          <LoginFormInner />
        </Suspense>
      </div>
    </div>
  );
}
