/**
 * middleware.ts — Next.js Edge Middleware (Phase 4, optimised Phase 6)
 * ──────────────────────────────────────────────────────────────────────
 * Runs ONLY on routes that need auth checks (dashboard, admin, auth pages).
 * Public pages (/, /rooms, /gallery, /faq, /contact, /about) are excluded
 * entirely so they load with zero middleware overhead.
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session (keeps JWTs alive)
 * 2. Protected route guard → redirect unauthenticated users to /login
 * 3. Admin route guard → redirect non-admin users to home
 * 4. Auth page guard → redirect authenticated users away from /login, /register
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware-client';

// ─── Route Configuration ──────────────────────────────────────────────────────

/** Routes that require any authentication */
const PROTECTED_PREFIXES = ['/dashboard'];

/** Routes that require admin/staff role */
const ADMIN_PREFIXES = ['/admin'];

/** Routes that authenticated users should NOT see */
const AUTH_ONLY = ['/login', '/register', '/forgot-password'];

/** Admin roles */
const ADMIN_ROLES = ['reception', 'manager', 'admin', 'super_admin'];

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const pathname = request.nextUrl.pathname;

  // Refresh session cookie — required for SSR auth
  const supabase = createMiddlewareClient(request, response);
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // 1. Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ONLY.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Customer dashboard — must be logged in
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin panel — must be logged in AND have admin role
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', session.user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const roleNames = (userRoles ?? [])
        .map((r) => (r.roles as { name: string } | null)?.name)
        .filter(Boolean) as string[];

      if (!roleNames.some((r) => ADMIN_ROLES.includes(r))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Reset password requires session
  if (pathname.startsWith('/reset-password') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/forgot-password', request.url));
  }

  return response;
}

// ─── Matcher — ONLY run on routes that need auth logic ───────────────────────
// Public pages (/, /rooms, /gallery, /faq, /contact, /about, /book, /facilities,
// /policies) are intentionally EXCLUDED for maximum performance.

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/:path*',
    '/book',
  ],
};
