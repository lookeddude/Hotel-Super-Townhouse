/**
 * Supabase Middleware Client
 * ──────────────────────────
 * Use ONLY in middleware.ts (Next.js Edge Runtime).
 * Responsible for session refresh on every request.
 * Does NOT use Node.js APIs — Edge Runtime compatible.
 *
 * Usage:
 *   import { createMiddlewareClient } from '@/lib/supabase/middleware';
 */

import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate cookies to both the request and response
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
