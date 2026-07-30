'use client';

/**
 * Supabase Browser Client
 * ────────────────────────
 * Use ONLY in Client Components ('use client').
 * Singleton pattern — one instance per browser session.
 * Safe to import in any client-side code.
 *
 * Usage:
 *   import { createBrowserClient } from '@/lib/supabase/browser';
 *   const supabase = createBrowserClient();
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

// Singleton — prevents creating multiple GoTrue clients in the browser
let browserClientInstance: SupabaseClient<Database> | null = null;

export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClientInstance) return browserClientInstance;

  browserClientInstance = createSupabaseBrowserClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );

  return browserClientInstance;
}

/**
 * Hook-friendly alias.
 * Use this in React components and hooks.
 */
export const getSupabaseBrowserClient = createBrowserClient;
