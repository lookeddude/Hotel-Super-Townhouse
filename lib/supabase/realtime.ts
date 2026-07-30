/**
 * Supabase Realtime Helpers
 * ──────────────────────────
 * Architecture preparation for all realtime channels.
 * Phase 3 will implement the actual subscription logic.
 *
 * Channels:
 * - bookings         → Live booking status updates
 * - room-availability → Room availability changes
 * - user-notifications → In-app notifications
 * - admin-dashboard  → Admin KPI live updates
 * - reviews-feed     → New review alerts
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

type Client = SupabaseClient<Database>;

// ─── Channel factory helpers ──────────────────────────────────────────────────

/**
 * Creates a realtime channel for live booking updates.
 * Phase 3: subscribe to bookings table changes.
 */
export function createBookingsChannel(
  client: Client,
  onEvent: (payload: unknown) => void
): RealtimeChannel {
  return client
    .channel(supabaseConfig.channels.bookings)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      onEvent
    );
}

/**
 * Creates a realtime channel for room availability changes.
 * Phase 3: subscribe to rooms table changes.
 */
export function createRoomAvailabilityChannel(
  client: Client,
  onEvent: (payload: unknown) => void
): RealtimeChannel {
  return client
    .channel(supabaseConfig.channels.roomAvailability)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms' },
      onEvent
    );
}

/**
 * Creates a realtime channel for user-specific notifications.
 * Phase 3: subscribe with user filter.
 */
export function createNotificationsChannel(
  client: Client,
  userId: string,
  onEvent: (payload: unknown) => void
): RealtimeChannel {
  return client
    .channel(`${supabaseConfig.channels.notifications}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      onEvent
    );
}

/**
 * Creates a broadcast channel for admin dashboard live updates.
 * Phase 3: broadcast from edge functions.
 */
export function createAdminDashboardChannel(
  client: Client,
  onMessage: (payload: unknown) => void
): RealtimeChannel {
  return client
    .channel(supabaseConfig.channels.adminDashboard)
    .on('broadcast', { event: 'dashboard_update' }, onMessage);
}

/**
 * Creates a realtime channel for new reviews.
 */
export function createReviewsChannel(
  client: Client,
  onEvent: (payload: unknown) => void
): RealtimeChannel {
  return client
    .channel(supabaseConfig.channels.reviews)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reviews' },
      onEvent
    );
}

/**
 * Safely unsubscribes and removes a channel.
 */
export async function removeChannel(
  client: Client,
  channel: RealtimeChannel
): Promise<void> {
  await client.removeChannel(channel);
}
