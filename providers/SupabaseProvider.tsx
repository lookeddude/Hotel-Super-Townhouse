'use client';

/**
 * SupabaseProvider
 * ─────────────────
 * Provides the Supabase browser client to all client components via context.
 * Wraps the app to ensure a single shared client instance.
 *
 * Phase 3: Will also provide session, user, and role via this context.
 *
 * Usage:
 *   const { supabase } = useSupabase();
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase/browser';

// ─── Context ──────────────────────────────────────────────────────────────────

interface SupabaseContextValue {
  supabase: SupabaseClient<Database>;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Memoize so the client instance is stable across re-renders
  const supabase = useMemo(() => createBrowserClient(), []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the Supabase client from any client component.
 *
 * @example
 *   const { supabase } = useSupabase();
 *   const { data } = await supabase.from('rooms').select('*');
 */
export function useSupabase(): SupabaseContextValue {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>');
  }
  return context;
}
