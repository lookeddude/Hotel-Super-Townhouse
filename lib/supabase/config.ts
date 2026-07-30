/**
 * Supabase Shared Configuration
 * ─────────────────────────────
 * Central source of truth for all Supabase client configuration.
 * All clients (browser, server, admin) import from here.
 *
 * Project: Hotel Super Townhouse
 * Ref:     jzcmfpvscdsvkijpgdlj
 */

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  /** Auth cookie configuration for SSR */
  auth: {
    cookieName: 'sb-jzcmfpvscdsvkijpgdlj-auth-token',
    cookieOptions: {
      name: 'sb-jzcmfpvscdsvkijpgdlj-auth-token',
      lifetime: 60 * 60 * 8,        // 8 hours
      domain: '',
      path: '/',
      sameSite: 'lax' as const,
    },
  },

  /** Realtime channel names — used for future subscriptions */
  channels: {
    bookings: 'bookings-realtime',
    roomAvailability: 'room-availability',
    notifications: 'user-notifications',
    adminDashboard: 'admin-dashboard',
    reviews: 'reviews-feed',
  },

  /** Storage bucket names */
  storage: {
    roomImages: 'room-images',
    gallery: 'gallery',
    hotelAssets: 'hotel-assets',
    profileImages: 'profile-images',
    documents: 'documents',
    invoiceFiles: 'invoice-files',
  },
} as const;

/**
 * Validates that required environment variables are present.
 * Call this in server startup paths to catch misconfiguration early.
 */
export function validateSupabaseConfig(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[Supabase] Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env.local file.'
    );
  }
}
