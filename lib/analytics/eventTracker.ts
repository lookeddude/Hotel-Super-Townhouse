/**
 * lib/analytics/eventTracker.ts
 * Server-side event tracker — call from API routes only.
 */
import { createServiceClient } from '@/lib/supabase/service';

export const EVENT_TYPES = {
  BOOKING_CREATED:    'booking_created',
  BOOKING_CONFIRMED:  'booking_confirmed',
  BOOKING_CANCELLED:  'booking_cancelled',
  BOOKING_COMPLETED:  'booking_completed',
  CHECKIN:            'checkin',
  CHECKOUT:           'checkout',
  PAYMENT_SUCCESS:    'payment_success',
  PAYMENT_FAILED:     'payment_failed',
  REFUND_INITIATED:   'refund_initiated',
  REVIEW_SUBMITTED:   'review_submitted',
  REVIEW_APPROVED:    'review_approved',
  ROOM_STATUS_CHANGED:'room_status_changed',
  OFFER_USED:         'offer_used',
  CONTACT_SUBMITTED:  'contact_submitted',
  SEARCH_PERFORMED:   'search_performed',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export async function trackServerEvent(
  eventType: EventType,
  params?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const db = createServiceClient();
    await (db as any).from('analytics_events').insert({
      event_type: eventType,
      entity_type: params?.entityType,
      entity_id: params?.entityId,
      user_id: params?.userId,
      metadata: params?.metadata ?? {},
    });
  } catch { /* Non-fatal */ }
}
