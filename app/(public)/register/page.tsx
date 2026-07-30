'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

import { registerSchema, type RegisterValues } from '@/lib/validations/authSchema';
import { signUpWithEmail } from '@/lib/supabase/auth';
import { useSupabase } from '@/providers/SupabaseProvider';
import { ROUTES } from '@/constants/routes';

export default function RegisterPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (values: RegisterValues) => {
    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(supabase, {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.emailConfirmationRequired) {
        setRegisteredEmail(values.email);
        setEmailSent(true);
      } else {
        toast.success('Account created! Welcome to Super Townhouse.');
        router.push(ROUTES.dashboard);
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Email sent confirmation screen ──────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h1 className="font-heading text-headline-md text-on-surface mb-2">
              Verify your email
            </h1>
            <p className="text-sm text-on-surface-variant mb-4">
              We sent a verification link to{' '}
              <span className="font-semibold text-on-surface">{registeredEmail}</span>
            </p>
            <p className="text-sm text-on-surface-variant mb-6">
              Click the link in the email to activate your account. Check your spam folder if you
              don&apos;t see it.
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
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl mb-4">
              ST
            </div>
            <h1 className="font-heading text-headline-md text-on-surface">Create Account</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Join Super Townhouse for exclusive benefits
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="text-label-md text-on-surface">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                disabled={isSubmitting}
                {...register('fullName')}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
                  errors.fullName
                    ? 'border-error focus:border-error'
                    : 'border-outline-variant focus:border-on-surface'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-error">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-label-md text-on-surface">
                Email Address
              </label>
              <input
                id="reg-email"
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
              {errors.email && (
                <p className="text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="reg-phone" className="text-label-md text-on-surface">
                Phone Number
              </label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+91 99999 00000"
                autoComplete="tel"
                disabled={isSubmitting}
                {...register('phone')}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
                  errors.phone
                    ? 'border-error focus:border-error'
                    : 'border-outline-variant focus:border-on-surface'
                }`}
              />
              {errors.phone && <p className="text-xs text-error">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-label-md text-on-surface">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-outline-variant'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant">{passwordStrength.label}</p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-label-md text-on-surface">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  {...register('confirmPassword')}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none transition-colors disabled:opacity-50 ${
                    errors.confirmPassword
                      ? 'border-error focus:border-error'
                      : 'border-outline-variant focus:border-on-surface'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Accept Terms */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="accent-primary mt-0.5 w-4 h-4"
                />
                <span className="text-sm text-on-surface-variant">
                  I agree to the{' '}
                  <Link href={ROUTES.policies} className="text-primary hover:underline">
                    Terms &amp; Policies
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-error">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-1 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{' '}
            <Link href={ROUTES.login} className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Password Strength Utility ────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const capped = Math.min(score, 4);

  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: 'bg-error' },
    2: { label: 'Fair', color: 'bg-warning' },
    3: { label: 'Good', color: 'bg-primary' },
    4: { label: 'Strong', color: 'bg-success' },
  };

  return { score: capped, ...(map[capped] ?? { label: '', color: '' }) };
}
