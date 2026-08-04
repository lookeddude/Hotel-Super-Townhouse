'use client';
/**
 * Phase 9 — Full Guest Notification Center with Preferences
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { upsertPreference, getUserPreferences } from '@/services/notificationService';
import {
  Bell, CheckCheck, Trash2, Check, Settings, RefreshCw,
  CalendarDays, CreditCard, Star, Tag, AlertTriangle, Info, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';


const PREF_ROWS = [
  { type: 'booking_confirmed'  as const, label: 'Booking Updates',       desc: 'Confirmations, modifications, cancellations' },
  { type: 'payment_received'   as const, label: 'Payment Notifications',  desc: 'Receipts, failures, and refunds' },
  { type: 'review_request'     as const, label: 'Review Requests',        desc: 'Post-stay review reminders' },
  { type: 'checkin_reminder'   as const, label: 'Check-in Reminders',     desc: '24h and 2h before arrival' },
  { type: 'checkout_reminder'  as const, label: 'Check-out Reminders',    desc: 'Day-of check-out alerts' },
  { type: 'marketing'          as const, label: 'Offers & Promotions',    desc: 'Exclusive deals and packages' },
  { type: 'admin_alert'        as const, label: 'Account Alerts',         desc: 'Important system messages' },
];

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getIcon(type: string) {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'checkin_reminder':
    case 'checkout_reminder': return <CalendarDays size={14} />;
    case 'payment_received':
    case 'payment_failed':    return <CreditCard size={14} />;
    case 'review_request':    return <Star size={14} />;
    case 'marketing':         return <Tag size={14} />;
    case 'admin_alert':       return <AlertTriangle size={14} />;
    default:                  return <Info size={14} />;
  }
}

function getIconBg(type: string) {
  switch (type) {
    case 'payment_failed':
    case 'booking_cancelled':  return 'bg-red-100 text-red-600';
    case 'payment_received':
    case 'booking_confirmed':  return 'bg-green-100 text-green-600';
    case 'admin_alert':        return 'bg-orange-100 text-orange-600';
    case 'marketing':          return 'bg-purple-100 text-purple-600';
    default:                   return 'bg-primary/10 text-primary';
  }
}

export default function UserNotificationsPage() {
  const { supabase }                                          = useSupabase();
  const { user, isAdmin }                                     = useAuth();
  const router                                                = useRouter();
  const { notifications: allNotifications, loading, markRead, markAllRead, deleteOne, refresh } = useNotifications(50);
  const [tab, setTab]           = useState<'all' | 'unread' | 'preferences'>('all');
  const [prefs, setPrefs]       = useState<any[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [saving, setSaving]     = useState<string | null>(null);

  // 🔒 Staff/admin users should use admin panel notifications, not customer dashboard
  useEffect(() => {
    if (isAdmin) router.replace('/admin/notifications');
  }, [isAdmin, router]);

  // Only show pure customer notification types — never staff/operational alerts
  const CUSTOMER_TYPES = new Set([
    'booking_confirmed', 'booking_cancelled', 'booking_reminder',
    'payment_received',  'payment_failed',    'refund_processed',
    'review_request',    'checkin_reminder',  'checkout_reminder',
    'marketing',         'system',
    'offer_expiry',      'contact_reply',
  ]);
  const notifications = allNotifications.filter(n => CUSTOMER_TYPES.has(n.type));
  const unreadCount   = notifications.filter(n => !n.is_read).length;

  // Don't render anything while redirecting admin
  if (isAdmin) return null;

  const loadPrefs = async () => {
    if (!user?.id) return;
    setPrefsLoading(true);
    const p = await getUserPreferences(supabase, user.id);
    setPrefs(p);
    setPrefsLoading(false);
  };

  useEffect(() => {
    if (tab === 'preferences') loadPrefs();
  }, [tab]);

  const isEnabled = (type: string, channel: string) => {
    const found = prefs.find(p => p.notification_type === type && p.channel === channel);
    return found?.enabled !== false;
  };

  const handleToggle = async (type: string, channel: string, enabled: boolean) => {
    if (!user?.id) return;
    setSaving(`${type}:${channel}`);
    const ok = await upsertPreference(supabase, user.id, type as any, channel as any, enabled);
    if (ok) {
      setPrefs(prev => {
        const exists = prev.find(p => p.notification_type === type && p.channel === channel);
        if (exists) return prev.map(p => p.notification_type === type && p.channel === channel ? { ...p, enabled } : p);
        return [...prev, { notification_type: type, channel, enabled }];
      });
      toast.success('Preference saved');
    } else {
      toast.error('Failed to save preference');
    }
    setSaving(null);
  };

  const displayed = tab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · Stay updated on your bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button onClick={refresh} disabled={loading}
            className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit border border-outline-variant">
        {([
          { key: 'all',         label: `All (${notifications.length})`,        icon: Bell },
          { key: 'unread',      label: `Unread (${unreadCount})`,              icon: Bell },
          { key: 'preferences', label: 'Preferences',                          icon: Settings },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {tab !== 'preferences' && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading notifications…</div>
          ) : displayed.length === 0 ? (
            <div className="py-20 text-center">
              <Bell size={40} className="mx-auto text-outline mb-3" />
              <p className="font-medium text-on-surface">No notifications</p>
              <p className="text-sm text-on-surface-variant mt-1">
                {tab === 'unread' ? 'All caught up! No unread notifications.' : 'You haven\'t received any notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {displayed.map(n => (
                <div
                  key={n.id}
                  className={`group flex items-start gap-4 px-5 py-4 hover:bg-surface/50 transition-colors ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${getIconBg(n.type)}`}>
                    {getIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm text-on-surface leading-tight ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-on-surface-variant">{timeAgo(n.created_at)}</span>
                      {(n.data?.action_url as string) && (
                        <Link href={n.data!.action_url as string} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                          View details <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} title="Mark read"
                        className="p-1.5 rounded hover:bg-green-100 hover:text-green-600 text-on-surface-variant transition-colors">
                        <Check size={13} />
                      </button>
                    )}
                    <button onClick={() => deleteOne(n.id)} title="Delete"
                      className="p-1.5 rounded hover:bg-red-100 hover:text-red-500 text-on-surface-variant transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences */}
      {tab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h2 className="font-semibold text-on-surface">Notification Preferences</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Control what notifications you receive and where</p>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {prefsLoading ? (
                <div className="p-8 text-center text-on-surface-variant">Loading preferences…</div>
              ) : (
                PREF_ROWS.map(row => (
                  <div key={row.type} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface">{row.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{row.desc}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        {/* In-App toggle */}
                        <div className="text-center">
                          <p className="text-[10px] text-on-surface-variant mb-1">In-App</p>
                          <button
                            onClick={() => handleToggle(row.type, 'in_app', !isEnabled(row.type, 'in_app'))}
                            disabled={saving === `${row.type}:in_app`}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isEnabled(row.type, 'in_app') ? 'bg-primary' : 'bg-outline-variant'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled(row.type, 'in_app') ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        {/* Email toggle */}
                        <div className="text-center">
                          <p className="text-[10px] text-on-surface-variant mb-1">Email</p>
                          <button
                            onClick={() => handleToggle(row.type, 'email', !isEnabled(row.type, 'email'))}
                            disabled={saving === `${row.type}:email`}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isEnabled(row.type, 'email') ? 'bg-primary' : 'bg-outline-variant'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled(row.type, 'email') ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        {/* Future channels */}
                        <div className="text-center opacity-40">
                          <p className="text-[10px] text-on-surface-variant mb-1">SMS</p>
                          <div className="w-10 h-5 rounded-full bg-outline-variant relative">
                            <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow" />
                          </div>
                        </div>
                        <div className="text-center opacity-40">
                          <p className="text-[10px] text-on-surface-variant mb-1">WhatsApp</p>
                          <div className="w-10 h-5 rounded-full bg-outline-variant relative">
                            <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Future channels notice */}
          <div className="bg-surface border border-outline-variant rounded-xl p-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Coming Soon</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '📱', label: 'SMS Notifications' },
                { icon: '💬', label: 'WhatsApp Messages' },
                { icon: '🔔', label: 'Push Notifications' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant rounded-lg opacity-60">
                  <span>{f.icon}</span>
                  <span className="text-xs text-on-surface-variant">{f.label}</span>
                  <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
