import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getUserRole, ensureCustomerRole, isAdminRole } from '@/lib/supabase/auth';

/**
 * Auth Callback Route Handler — Phase 4
 * ──────────────────────────────────────
 * Handles:
 * 1. OAuth redirect (Google etc.)
 * 2. Email confirmation
 * 3. Password reset redirect
 *
 * After session exchange:
 * - Ensures customer role is assigned to new users
 * - Role-based redirect: customer → /dashboard, admin → /admin/dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 'recovery' for password reset
  const next = requestUrl.searchParams.get('next');

  // ── Handle errors from Supabase ──────────────────────────────────────────
  if (error) {
    const errorUrl = new URL('/auth/error', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    if (errorDescription) errorUrl.searchParams.set('description', errorDescription);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const errorUrl = new URL('/auth/error', requestUrl.origin);
      errorUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(errorUrl);
    }

    const user = data.user;

    if (user) {
      // ── Password reset flow → go to reset-password page ────────────────
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
      }

      // ── New user via OAuth or email confirmation ─────────────────────────
      // Ensure they have the customer role
      await ensureCustomerRole(supabase, user.id);

      // ── Role-based redirect ──────────────────────────────────────────────
      if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      const role = await getUserRole(supabase, user.id);
      const destination = isAdminRole(role) ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  // No code → back to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
