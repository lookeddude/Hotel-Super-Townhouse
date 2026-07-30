/**
 * Supabase Admin Client
 * ─────────────────────
 * Use ONLY in server-side trusted code:
 * - API Route Handlers
 * - Server Actions
 * - Edge Functions
 * - Cron jobs
 *
 * ⚠️  NEVER import this in Client Components.
 * ⚠️  NEVER expose the service role key to the browser.
 * ⚠️  This client bypasses Row Level Security (RLS).
 *
 * Usage:
 *   import { createAdminClient } from '@/lib/supabase/admin';
 *   const supabase = createAdminClient();
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

export function createAdminClient() {
  if (!supabaseConfig.serviceRoleKey) {
    throw new Error(
      '[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
        'Add it to your .env.local file (server-side only).'
    );
  }

  return createClient<Database>(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
