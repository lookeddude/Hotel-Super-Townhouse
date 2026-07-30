/**
 * lib/supabase/index.ts
 * ─────────────────────
 * Barrel export for all Supabase utilities.
 * Import from '@/lib/supabase' for clean import paths.
 *
 * Usage:
 *   import { createBrowserClient, createServerClient, createAdminClient } from '@/lib/supabase';
 */

// Clients
export { createBrowserClient, getSupabaseBrowserClient } from './browser';
export { createServerClient } from './server';
export { createMiddlewareClient } from './middleware-client';
export { createAdminClient } from './admin';

// Auth helpers
export * from './auth';

// Storage helpers
export * from './storage';

// Realtime helpers
export * from './realtime';

// Config
export { supabaseConfig, validateSupabaseConfig } from './config';
