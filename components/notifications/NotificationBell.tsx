'use client';
/**
 * components/notifications/NotificationBell.tsx
 * Phase 9 — Realtime Notification Bell with slide-over panel
 */
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, X, Check, CheckCheck, Trash2, ExternalLink,
  CalendarDays, CreditCard, Star, AlertTriangle, Tag,
  MessageSquare, Settings, Info,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { type Notification, type NotificationType } from '@/services/notificationService';
import { cn } from '@/lib/utils';

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'checkin_reminder':
    case 'checkout_reminder': return <CalendarDays size={14} />;
    case 'payment_received':
    case 'payment_failed':
    case 'refund_processed':  return <CreditCard size={14} />;
    case 'review_request':
    case 'review_approved':
    case 'review_rejected':   return <Star size={14} />;
    case 'admin_alert':       return <AlertTriangle size={14} />;
    case 'marketing':
    case 'offer_expiry':      return <Tag size={14} />;
    case 'staff_assignment':  return <Settings size={14} />;
    case 'contact_reply':     return <MessageSquare size={14} />;
    default:                  return <Info size={14} />;
  }
}

function getNotifColor(type: NotificationType): string {
  switch (type) {
    case 'payment_failed':
    case 'review_rejected':
    case 'booking_cancelled':  return 'bg-red-100 text-red-600';
    case 'payment_received':
    case 'review_approved':
    case 'booking_confirmed':  return 'bg-green-100 text-green-600';
    case 'admin_alert':        return 'bg-orange-100 text-orange-600';
    case 'marketing':
    case 'offer_expiry':       return 'bg-purple-100 text-purple-600';
    default:                   return 'bg-primary/10 text-primary';
  }
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)         return 'just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({
  n, onMarkRead, onDelete
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
  onDelete:   (id: string) => void;
}) {
  return (
    <div className={cn(
      'group flex items-start gap-3 px-4 py-3 hover:bg-surface/60 transition-colors border-b border-outline-variant/40 last:border-0',
      !n.is_read && 'bg-primary/[0.03]'
    )}>
      {/* Icon */}
      <div className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5', getNotifColor(n.type as NotificationType))}>
        {getNotifIcon(n.type as NotificationType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={cn('text-sm font-medium text-on-surface leading-tight', !n.is_read && 'font-semibold')}>
            {n.title}
          </p>
          {!n.is_read && <span className="shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />}
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-on-surface-variant">{timeAgo(n.created_at)}</span>
          {n.action_url && (
            <Link href={n.action_url} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              View <ExternalLink size={9} />
            </Link>
          )}
        </div>
      </div>

      {/* Actions — shown on hover */}
      <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.is_read && (
          <button onClick={() => onMarkRead(n.id)} title="Mark read"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-green-100 hover:text-green-600 text-on-surface-variant transition-colors">
            <Check size={12} />
          </button>
        )}
        <button onClick={() => onDelete(n.id)} title="Delete"
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100 hover:text-red-600 text-on-surface-variant transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteOne } = useNotifications(20);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        className="relative p-2 rounded-lg hover:bg-surface transition-colors"
      >
        <Bell size={18} className="text-on-surface-variant" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-xl border border-outline-variant shadow-level-3 z-50 flex flex-col max-h-[520px]">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <span className="font-semibold text-sm text-on-surface">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all as read"
                  className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-surface transition-colors">
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface transition-colors">
                <X size={14} className="text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={28} className="mx-auto text-outline mb-2" />
                <p className="text-sm text-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} n={n} onMarkRead={markRead} onDelete={deleteOne} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-outline-variant px-4 py-2.5 flex items-center justify-between">
            <Link href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline">
              View all notifications
            </Link>
            <span className="text-xs text-on-surface-variant">{notifications.length} shown</span>
          </div>
        </div>
      )}
    </div>
  );
}
