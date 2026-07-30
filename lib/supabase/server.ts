/**
 * Supabase Server Client
 * ──────────────────────
 * Use ONLY in Server Components, Route Handlers, and Server Actions.
 * Creates a fresh client per request (Next.js server context).
 * Reads/writes session cookies automatically via @supabase/ssr.
 *
 * Usage:
 *   import { createServerClient } from '@/lib/supabase/server';
 *   const supabase = await createServerClient();
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
