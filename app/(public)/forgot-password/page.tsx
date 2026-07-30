'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';

import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validations/authSchema';
import { sendPasswordReset } from '@/lib/supabase/auth';
import { useSupabase } from '@/providers/SupabaseProvider';
import { ROUTES } from '@/constants/routes';

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      await sendPasswordReset(
        supabase,
        values.email,
        `${window.location.origin}/auth/callback?type=recovery`
      );
      setEmailSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setEmailSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-primary" />
            </div>
            <h1 className="font-heading text-headline-md text-on-surface mb-2">Check your email</h1>
            <p className="text-sm text-on-surface-variant mb-4">
              If an account exists for{' '}
              <span className="font-semibold text-on-surface">{getValues('email')}</span>, we&apos;ve
              sent a password reset link.
            </p>
            <p className="text-sm text-on-surface-variant mb-6">
              The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
            </p>
            <Link
              href={ROUTES.login}
              className="block w-full py-3 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">?</span>
            </div>
            <h1 className="font-heading text-headline-md text-on-surface">Reset Password</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Enter your email to receive a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-label-md text-on-surface">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                disabled={isSubmitting}
                {...register('email')}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
                  errors.email
                    ? 'border-error focus:border-error'
                    : 'border-outline-variant focus:border-on-surface'
                }`}
              />
              {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Remember your password?{' '}
            <Link href={ROUTES.login} className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
