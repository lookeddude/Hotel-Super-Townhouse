/**
 * lib/supabase/service.ts
 * Supabase Service Role Client — bypasses RLS.
 * Use ONLY in server-side API routes and webhooks.
 * NEVER import in client components or pages.
 */

import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase service role credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
