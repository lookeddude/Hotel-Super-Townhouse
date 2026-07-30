/**
 * services/schedulerService.ts
 * Phase 9 — Scheduled Reminder Architecture
 *
 * This module provides the scheduler interface.
 * In production, use Supabase Edge Function with pg_cron or
 * an external cron (Vercel Cron / Supabase pg_cron) to call
 * processScheduledReminders() on a schedule.
 */

export interface PendingReminder {
  id:               string;
  reminder_type:    string;
  entity_type?:     string;
  entity_id?:       string;
  recipient_id:     string;
  recipient_email?: string;
  channels:         string[];
  template_id?:     string;
  template_vars:    Record<string, string>;
  scheduled_at:     string;
  retry_count:      number;
}

/** Fetch reminders that are due to run */
export async function getDueReminders(supabase: any): Promise<PendingReminder[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('scheduled_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .lt('retry_count', 3)
      .order('scheduled_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as PendingReminder[];
  } catch {
    return [];
  }
}

/** Mark a reminder as sent */
export async function markReminderSent(supabase: any, id: string): Promise<void> {
  await (supabase as any)
    .from('scheduled_reminders')
    .update({ status: 'sent', executed_at: new Date().toISOString() })
    .eq('id', id);
}

/** Mark a reminder as failed and increment retry count */
export async function markReminderFailed(
  supabase: any,
  id: string,
  maxRetries = 3
): Promise<void> {
  const { data } = await (supabase as any)
    .from('scheduled_reminders')
    .select('retry_count')
    .eq('id', id)
    .single();

  const retryCount = (data?.retry_count ?? 0) + 1;
  const newStatus  = retryCount >= maxRetries ? 'failed' : 'pending';

  await (supabase as any)
    .from('scheduled_reminders')
    .update({ retry_count: retryCount, status: newStatus })
    .eq('id', id);
}

/** Cancel a scheduled reminder */
export async function cancelReminder(supabase: any, id: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('scheduled_reminders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'pending');
    return !error;
  } catch {
    return false;
  }
}

/** Cancel all pending reminders for a booking (on cancellation) */
export async function cancelBookingReminders(supabase: any, bookingId: string): Promise<void> {
  try {
    await (supabase as any)
      .from('scheduled_reminders')
      .update({ status: 'cancelled' })
      .eq('entity_type', 'booking')
      .eq('entity_id', bookingId)
      .eq('status', 'pending');
  } catch { /* Non-fatal */ }
}

/** Get scheduler stats for admin dashboard */
export async function getSchedulerStats(supabase: any) {
  try {
    const { data } = await (supabase as any)
      .from('scheduled_reminders')
      .select('status');
    const rows = data ?? [];
    return {
      pending:   rows.filter((r: any) => r.status === 'pending').length,
      sent:      rows.filter((r: any) => r.status === 'sent').length,
      failed:    rows.filter((r: any) => r.status === 'failed').length,
      cancelled: rows.filter((r: any) => r.status === 'cancelled').length,
      total:     rows.length,
    };
  } catch {
    return { pending: 0, sent: 0, failed: 0, cancelled: 0, total: 0 };
  }
}

/** Get upcoming reminders list (admin view) */
export async function getUpcomingReminders(supabase: any, limit = 20) {
  try {
    const { data } = await (supabase as any)
      .from('scheduled_reminders')
      .select('*, profiles:recipient_id(full_name, email)')
      .eq('status', 'pending')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
