'use client';
/**
 * hooks/useNotifications.ts
 * Phase 9 — Realtime in-app notification hook
 *
 * Provides:
 *   notifications  — sorted list
 *   unreadCount    — badge count
 *   markRead()     — mark single read
 *   markAllRead()  — mark all read
 *   deleteOne()    — delete single
 *   refresh()      — manual reload
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  type Notification,
} from '@/services/notificationService';

export function useNotifications(limit = 30) {
  const { supabase } = useSupabase();
  const { user }     = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [notifs, count] = await Promise.all([
      getUserNotifications(supabase, user.id, { limit }),
      getUnreadCount(supabase, user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, [supabase, user, limit]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = (supabase as any)
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [supabase, user?.id, load]);

  const markRead = useCallback(async (id: string) => {
    const ok = await markNotificationRead(supabase, id);
    if (ok) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [supabase]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    const ok = await markAllNotificationsRead(supabase, user.id);
    if (ok) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [supabase, user]);

  const deleteOne = useCallback(async (id: string) => {
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
    const ok = await deleteNotification(supabase, id);
    if (ok) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [supabase, notifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, deleteOne, refresh: load };
}
