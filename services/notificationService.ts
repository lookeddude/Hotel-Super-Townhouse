/**
 * services/notificationService.ts
 * Phase 9 — Central Notification Service
 *
 * Single entry point for ALL in-app notification operations.
 * Every create/read/archive action goes through here.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationType =
  | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder'
  | 'payment_received'  | 'payment_failed'    | 'refund_processed'
  | 'review_request'    | 'review_approved'   | 'review_rejected'
  | 'admin_alert'       | 'staff_assignment'  | 'room_maintenance'
  | 'marketing'         | 'system'            | 'checkin_reminder'
  | 'checkout_reminder' | 'offer_expiry'      | 'contact_reply';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateNotificationPayload {
  userId:       string;
  type:         NotificationType;
  title:        string;
  body:         string;
  channel?:     NotificationChannel;
  priority?:    NotificationPriority;
  actionUrl?:   string;
  metadata?:    Record<string, unknown>;
}

export interface Notification {
  id:          string;
  user_id:     string;
  type:        NotificationType;
  title:       string;
  body:        string;
  channel:     NotificationChannel;
  is_read:     boolean;
  action_url?: string;
  metadata:    Record<string, unknown>;
  created_at:  string;
}

export interface NotificationPreference {
  id:                  string;
  user_id:             string;
  notification_type:   NotificationType;
  channel:             NotificationChannel;
  enabled:             boolean;
}

// ─── Create a notification ────────────────────────────────────────────────────
export async function createNotification(
  supabase: any,
  payload: CreateNotificationPayload
): Promise<Notification | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id:    payload.userId,
        type:       payload.type,
        title:      payload.title,
        body:       payload.body,
        channel:    payload.channel ?? 'in_app',
        is_read:    false,
        action_url: payload.actionUrl,
        metadata:   payload.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  } catch (err) {
    console.error('[notificationService] createNotification:', err);
    return null;
  }
}

// ─── Fetch notifications for a user ──────────────────────────────────────────
export async function getUserNotifications(
  supabase: any,
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<Notification[]> {
  try {
    let query = (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Notification[];
  } catch (err) {
    console.error('[notificationService] getUserNotifications:', err);
    return [];
  }
}

// ─── Mark single notification as read ────────────────────────────────────────
export async function markNotificationRead(
  supabase: any,
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[notificationService] markNotificationRead:', err);
    return false;
  }
}

// ─── Mark all as read for a user ─────────────────────────────────────────────
export async function markAllNotificationsRead(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[notificationService] markAllNotificationsRead:', err);
    return false;
  }
}

// ─── Delete a notification ────────────────────────────────────────────────────
export async function deleteNotification(
  supabase: any,
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[notificationService] deleteNotification:', err);
    return false;
  }
}

// ─── Get unread count ─────────────────────────────────────────────────────────
export async function getUnreadCount(supabase: any, userId: string): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ─── Notification Preferences ─────────────────────────────────────────────────
export async function getUserPreferences(
  supabase: any,
  userId: string
): Promise<NotificationPreference[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as NotificationPreference[];
  } catch (err) {
    console.error('[notificationService] getUserPreferences:', err);
    return [];
  }
}

export async function upsertPreference(
  supabase: any,
  userId: string,
  notificationType: NotificationType,
  channel: NotificationChannel,
  enabled: boolean
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('notification_preferences')
      .upsert(
        { user_id: userId, notification_type: notificationType, channel, enabled },
        { onConflict: 'user_id,notification_type,channel' }
      );
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[notificationService] upsertPreference:', err);
    return false;
  }
}

// ─── Check if user wants a notification (preference gating) ──────────────────
export async function isNotificationEnabled(
  supabase: any,
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  try {
    const { data } = await (supabase as any)
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', userId)
      .eq('notification_type', type)
      .eq('channel', channel)
      .maybeSingle();
    // Default: enabled (if no preference set, allow)
    return data?.enabled !== false;
  } catch {
    return true;
  }
}

// ─── Bulk create notifications (e.g., admin broadcast) ───────────────────────
export async function broadcastNotification(
  supabase: any,
  userIds: string[],
  payload: Omit<CreateNotificationPayload, 'userId'>
): Promise<number> {
  if (!userIds.length) return 0;
  try {
    const rows = userIds.map(uid => ({
      user_id:    uid,
      type:       payload.type,
      title:      payload.title,
      body:       payload.body,
      channel:    payload.channel ?? 'in_app',
      is_read:    false,
      action_url: payload.actionUrl,
      metadata:   payload.metadata ?? {},
    }));
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert(rows)
      .select('id');
    if (error) throw error;
    return (data ?? []).length;
  } catch (err) {
    console.error('[notificationService] broadcastNotification:', err);
    return 0;
  }
}

// ─── Get all notifications for admin view ────────────────────────────────────
export async function getAllNotificationsAdmin(
  supabase: any,
  options?: { limit?: number; type?: NotificationType; unreadOnly?: boolean }
) {
  try {
    let query = (supabase as any)
      .from('notifications')
      .select('*, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 100);

    if (options?.type)       query = query.eq('type', options.type);
    if (options?.unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('[notificationService] getAllNotificationsAdmin:', err);
    return [];
  }
}
