'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validations/authSchema';
import { updatePassword } from '@/lib/supabase/auth';
import { useSupabase } from '@/providers/SupabaseProvider';
import { ROUTES } from '@/constants/routes';

export default function ResetPasswordPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsSubmitting(true);
    try {
      const result = await updatePassword(supabase, values.password);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success('Password updated successfully! Please sign in.');
      router.push(ROUTES.login);
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-outline-variant p-8 shadow-level-2">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <h1 className="font-heading text-headline-md text-on-surface">Set New Password</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Choose a strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-label-md text-on-surface">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
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
              {errors.password && (
                <p className="text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-new-password" className="text-label-md text-on-surface">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your new password"
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

            <div className="bg-surface rounded-lg p-3 text-xs text-on-surface-variant space-y-1">
              <p className="font-semibold text-on-surface">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters long</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
