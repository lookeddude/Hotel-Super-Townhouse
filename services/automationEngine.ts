/**
 * services/automationEngine.ts
 * Phase 9 — Event-Driven Automation Engine
 *
 * Central workflow processor. Call triggerAutomation() from any
 * API route when a business event occurs. The engine creates
 * notifications, queues emails, logs activities, and schedules reminders.
 *
 * Usage (from an API route):
 *   await triggerAutomation(supabase, 'booking_confirmed', {
 *     entityType: 'booking', entityId: booking.id,
 *     userId: booking.guest_id,
 *     data: { booking_ref, guest_name, room_name, check_in, check_out, total_amount, ... }
 *   });
 */

import { createNotification, type NotificationType } from './notificationService';
import { queueEmail } from './emailService';
import { createActivityFeedEntry } from './activityFeedService';

export type AutomationTrigger =
  | 'booking_created'     | 'booking_confirmed'   | 'booking_cancelled'
  | 'booking_completed'   | 'booking_modified'
  | 'checkin_completed'   | 'checkout_completed'
  | 'payment_success'     | 'payment_failed'       | 'refund_completed'
  | 'review_submitted'    | 'review_approved'      | 'review_rejected'
  | 'room_maintenance'    | 'contact_submitted'    | 'staff_assignment'
  | 'offer_expiry'        | 'admin_broadcast';

export interface AutomationContext {
  entityType?: string;
  entityId?:   string;
  userId?:     string;             // recipient user ID
  adminId?:    string;             // who triggered (null = system)
  data?:       Record<string, string>;  // vars for notifications/emails
}

// ─── Trigger map — maps events → notification type + title/body ───────────────
const TRIGGER_MAP: Record<AutomationTrigger, {
  notificationType?: NotificationType;
  titleFn:           (d: Record<string, string>) => string;
  bodyFn:            (d: Record<string, string>) => string;
  actionUrl?:        (d: Record<string, string>) => string;
  emailTemplateId?:  string;
  activityIcon?:     string;
  activityColor?:    string;
  activityTitleFn?:  (d: Record<string, string>) => string;
}> = {
  booking_created: {
    notificationType: 'booking_confirmed',
    titleFn:  d => `Booking Received — ${d.booking_ref ?? ''}`,
    bodyFn:   d => `Your booking for ${d.room_name ?? 'a room'} has been received and is pending confirmation.`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'booking_confirmed',
    activityIcon: 'CalendarDays', activityColor: 'blue',
    activityTitleFn: d => `New booking ${d.booking_ref} by ${d.guest_name ?? 'Guest'}`,
  },
  booking_confirmed: {
    notificationType: 'booking_confirmed',
    titleFn:  d => `Booking Confirmed — ${d.booking_ref ?? ''}`,
    bodyFn:   d => `Great news! Your booking at Super Townhouse is confirmed. Check-in: ${d.check_in ?? ''}`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'booking_confirmed',
    activityIcon: 'CheckCircle', activityColor: 'green',
    activityTitleFn: d => `Booking ${d.booking_ref} confirmed`,
  },
  booking_cancelled: {
    notificationType: 'booking_cancelled',
    titleFn:  d => `Booking Cancelled — ${d.booking_ref ?? ''}`,
    bodyFn:   d => `Your booking has been cancelled. Refund: ${d.refund_amount ?? '₹0'}`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'booking_cancelled',
    activityIcon: 'XCircle', activityColor: 'red',
    activityTitleFn: d => `Booking ${d.booking_ref} cancelled`,
  },
  booking_modified: {
    notificationType: 'booking_confirmed',
    titleFn:  d => `Booking Updated — ${d.booking_ref ?? ''}`,
    bodyFn:   d => `Your booking dates have been updated. New check-in: ${d.check_in ?? ''}`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'booking_modified',
    activityIcon: 'Edit', activityColor: 'primary',
    activityTitleFn: d => `Booking ${d.booking_ref} modified`,
  },
  booking_completed: {
    notificationType: 'review_request',
    titleFn:  _d => 'How Was Your Stay?',
    bodyFn:   d => `Your stay is complete! We'd love to hear your feedback for booking ${d.booking_ref ?? ''}.`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'review_request',
    activityIcon: 'Star', activityColor: 'yellow',
    activityTitleFn: d => `Stay completed — ${d.booking_ref}`,
  },
  checkin_completed: {
    notificationType: 'booking_confirmed',
    titleFn:  d => `Welcome, ${d.guest_name ?? 'Guest'}!`,
    bodyFn:   d => `You have successfully checked in to Room ${d.room_number ?? ''}. Enjoy your stay!`,
    activityIcon: 'LogIn', activityColor: 'green',
    activityTitleFn: d => `${d.guest_name} checked in — Room ${d.room_number}`,
  },
  checkout_completed: {
    notificationType: 'checkout_reminder',
    titleFn:  d => `Safe Travels, ${d.guest_name ?? 'Guest'}!`,
    bodyFn:   _d => 'Thank you for staying with us. We hope to see you again soon!',
    emailTemplateId: 'checkout_reminder',
    activityIcon: 'LogOut', activityColor: 'primary',
    activityTitleFn: d => `${d.guest_name} checked out`,
  },
  payment_success: {
    notificationType: 'payment_received',
    titleFn:  d => `Payment Successful — ${d.amount ?? ''}`,
    bodyFn:   d => `Your payment of ${d.amount ?? ''} for booking ${d.booking_ref ?? ''} was successful.`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'payment_success',
    activityIcon: 'CreditCard', activityColor: 'green',
    activityTitleFn: d => `Payment ${d.amount} received for ${d.booking_ref}`,
  },
  payment_failed: {
    notificationType: 'payment_failed',
    titleFn:  _d => 'Payment Failed',
    bodyFn:   d => `Your payment for booking ${d.booking_ref ?? ''} failed. Please try again.`,
    actionUrl: d => `/dashboard/bookings/${d.booking_id ?? ''}`,
    emailTemplateId: 'payment_failed',
    activityIcon: 'AlertCircle', activityColor: 'red',
    activityTitleFn: d => `Payment failed for ${d.booking_ref}`,
  },
  refund_completed: {
    notificationType: 'refund_processed',
    titleFn:  d => `Refund Processed — ${d.refund_amount ?? ''}`,
    bodyFn:   d => `Your refund of ${d.refund_amount ?? ''} for booking ${d.booking_ref ?? ''} has been initiated.`,
    activityIcon: 'RotateCcw', activityColor: 'purple',
    activityTitleFn: d => `Refund ${d.refund_amount} for ${d.booking_ref}`,
  },
  review_submitted: {
    notificationType: 'review_request',
    titleFn:  _d => 'Review Received',
    bodyFn:   d => `A new review has been submitted by ${d.guest_name ?? 'a guest'} and is pending moderation.`,
    actionUrl: _d => '/admin/reviews',
    activityIcon: 'Star', activityColor: 'yellow',
    activityTitleFn: d => `New review from ${d.guest_name}`,
  },
  review_approved: {
    notificationType: 'review_approved',
    titleFn:  _d => 'Your Review is Live!',
    bodyFn:   _d => 'Your review has been approved and is now published. Thank you for your feedback!',
    activityIcon: 'CheckCircle', activityColor: 'green',
    activityTitleFn: d => `Review by ${d.guest_name} approved`,
  },
  review_rejected: {
    notificationType: 'review_rejected',
    titleFn:  _d => 'Review Not Published',
    bodyFn:   d => `Your review could not be published. Reason: ${d.reason ?? 'Community guidelines violation.'}`,
    activityIcon: 'XCircle', activityColor: 'red',
    activityTitleFn: d => `Review by ${d.guest_name} rejected`,
  },
  room_maintenance: {
    notificationType: 'room_maintenance',
    titleFn:  d => `Maintenance Alert — Room ${d.room_number ?? ''}`,
    bodyFn:   d => `Room ${d.room_number ?? ''} has been flagged for maintenance: ${d.issue ?? ''}`,
    actionUrl: _d => '/admin/rooms',
    activityIcon: 'Wrench', activityColor: 'orange',
    activityTitleFn: d => `Room ${d.room_number} flagged for maintenance`,
  },
  contact_submitted: {
    notificationType: 'admin_alert',
    titleFn:  d => `New Contact Message from ${d.guest_name ?? 'Guest'}`,
    bodyFn:   d => `Subject: ${d.subject ?? 'General Inquiry'}`,
    actionUrl: _d => '/admin/contacts',
    emailTemplateId: 'contact_confirmation',
    activityIcon: 'MessageSquare', activityColor: 'blue',
    activityTitleFn: d => `New inquiry from ${d.guest_name}`,
  },
  staff_assignment: {
    notificationType: 'staff_assignment',
    titleFn:  d => `Task Assigned — ${d.task_title ?? ''}`,
    bodyFn:   d => `You have been assigned: ${d.task_description ?? ''}. Priority: ${d.priority ?? 'normal'}`,
    activityIcon: 'Users', activityColor: 'primary',
    activityTitleFn: d => `Staff assignment: ${d.task_title}`,
  },
  offer_expiry: {
    notificationType: 'marketing',
    titleFn:  d => `Offer Expiring Soon — ${d.offer_title ?? ''}`,
    bodyFn:   d => `The offer "${d.offer_title ?? ''}" expires on ${d.expiry_date ?? ''}. Book now to save!`,
    actionUrl: _d => '/rooms',
    activityIcon: 'Tag', activityColor: 'orange',
    activityTitleFn: d => `Offer expiring: ${d.offer_title}`,
  },
  admin_broadcast: {
    notificationType: 'admin_alert',
    titleFn:  d => d.title ?? 'Important Update',
    bodyFn:   d => d.body ?? '',
    activityIcon: 'Bell', activityColor: 'primary',
    activityTitleFn: d => `Admin broadcast: ${d.title}`,
  },
};

// ─── Main trigger function ────────────────────────────────────────────────────

export interface AutomationResult {
  success:      boolean;
  actions:      { action: string; status: 'done' | 'skipped' | 'failed'; detail?: string }[];
  durationMs:   number;
}

export async function triggerAutomation(
  supabase: any,
  trigger: AutomationTrigger,
  ctx: AutomationContext
): Promise<AutomationResult> {
  const start   = Date.now();
  const actions: AutomationResult['actions'] = [];
  const d       = ctx.data ?? {};
  const map     = TRIGGER_MAP[trigger];

  if (!map) {
    return { success: false, actions: [{ action: 'lookup', status: 'failed', detail: `Unknown trigger: ${trigger}` }], durationMs: 0 };
  }

  // ── Action 1: In-app notification ──────────────────────────────────────────
  if (map.notificationType && ctx.userId) {
    const n = await createNotification(supabase, {
      userId:    ctx.userId,
      type:      map.notificationType,
      title:     map.titleFn(d),
      body:      map.bodyFn(d),
      channel:   'in_app',
      actionUrl: map.actionUrl?.(d),
      metadata:  { trigger, entityType: ctx.entityType, entityId: ctx.entityId },
    });
    actions.push({ action: 'create_notification', status: n ? 'done' : 'failed', detail: n?.id });
  } else {
    actions.push({ action: 'create_notification', status: 'skipped', detail: 'no userId or notificationType' });
  }

  // ── Action 2: Queue email ──────────────────────────────────────────────────
  if (map.emailTemplateId && d.email) {
    const emailId = await queueEmail(supabase, {
      to:         d.email,
      toName:     d.guest_name ?? d.name,
      templateId: map.emailTemplateId as any,
      vars:       d,
      priority:   trigger === 'payment_failed' ? 1 : 5,
    });
    actions.push({ action: 'queue_email', status: emailId ? 'done' : 'failed', detail: emailId ?? undefined });
  } else {
    actions.push({ action: 'queue_email', status: 'skipped', detail: 'no email template or recipient email' });
  }

  // ── Action 3: Activity feed ────────────────────────────────────────────────
  if (map.activityTitleFn) {
    const fed = await createActivityFeedEntry(supabase, {
      eventType:  trigger,
      actorId:    ctx.adminId,
      actorName:  d.admin_name,
      entityType: ctx.entityType,
      entityId:   ctx.entityId,
      title:      map.activityTitleFn(d),
      icon:       map.activityIcon,
      color:      map.activityColor,
      linkHref:   map.actionUrl?.(d),
    });
    actions.push({ action: 'activity_feed', status: fed ? 'done' : 'failed', detail: fed ?? undefined });
  }

  // ── Action 4: Automation log ───────────────────────────────────────────────
  const durationMs = Date.now() - start;
  const allDone    = actions.every(a => a.status !== 'failed');

  try {
    await (supabase as any).from('automation_logs').insert({
      trigger_event: trigger,
      entity_type:   ctx.entityType,
      entity_id:     ctx.entityId,
      actions_taken: actions,
      status:        allDone ? 'success' : 'partial',
      duration_ms:   durationMs,
      triggered_by:  ctx.adminId ?? null,
      metadata:      d,
    });
  } catch { /* Non-fatal */ }

  return { success: allDone, actions, durationMs };
}

/** Schedule a future reminder */
export async function scheduleReminder(
  supabase: any,
  params: {
    reminderType:  string;
    entityType?:   string;
    entityId?:     string;
    recipientId:   string;
    recipientEmail?: string;
    channels?:     string[];
    templateId?:   string;
    templateVars?: Record<string, string>;
    scheduledAt:   Date | string;
  }
): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('scheduled_reminders')
      .insert({
        reminder_type:   params.reminderType,
        entity_type:     params.entityType,
        entity_id:       params.entityId,
        recipient_id:    params.recipientId,
        recipient_email: params.recipientEmail,
        channels:        params.channels ?? ['in_app'],
        template_id:     params.templateId,
        template_vars:   params.templateVars ?? {},
        scheduled_at:    typeof params.scheduledAt === 'string'
                           ? params.scheduledAt
                           : params.scheduledAt.toISOString(),
        status:          'pending',
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[automationEngine] scheduleReminder:', err);
    return null;
  }
}

/** Schedule standard hotel reminders for a booking */
export async function scheduleBookingReminders(
  supabase: any,
  booking: {
    id:       string;
    guestId:  string;
    email?:   string;
    checkIn:  string;   // YYYY-MM-DD
    checkOut: string;   // YYYY-MM-DD
    vars:     Record<string, string>;
  }
): Promise<void> {
  const checkInDate  = new Date(booking.checkIn  + 'T14:00:00');
  const checkOutDate = new Date(booking.checkOut + 'T10:00:00');

  const reminders = [
    {
      reminderType: 'checkin_24h',
      scheduledAt:  new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000),
      channels:     ['in_app', 'email'] as string[],
      templateId:   'checkin_reminder',
    },
    {
      reminderType: 'checkin_2h',
      scheduledAt:  new Date(checkInDate.getTime() - 2 * 60 * 60 * 1000),
      channels:     ['in_app'] as string[],
    },
    {
      reminderType: 'checkout_reminder',
      scheduledAt:  new Date(checkOutDate.getTime() - 2 * 60 * 60 * 1000),
      channels:     ['in_app', 'email'] as string[],
      templateId:   'checkout_reminder',
    },
    {
      reminderType: 'review_request',
      scheduledAt:  new Date(checkOutDate.getTime() + 2 * 60 * 60 * 1000),
      channels:     ['in_app', 'email'] as string[],
      templateId:   'review_request',
    },
  ];

  await Promise.allSettled(
    reminders
      .filter(r => r.scheduledAt > new Date())  // only schedule future reminders
      .map(r =>
        scheduleReminder(supabase, {
          reminderType:   r.reminderType,
          entityType:     'booking',
          entityId:       booking.id,
          recipientId:    booking.guestId,
          recipientEmail: booking.email,
          channels:       r.channels,
          templateId:     r.templateId,
          templateVars:   booking.vars,
          scheduledAt:    r.scheduledAt,
        })
      )
  );
}
