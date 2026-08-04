'use client';
/**
 * Admin Notifications Page — with action buttons per notification
 * Actions: Mark Read, Mark Unread, Delete, Open (smart redirect)
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getUserNotifications, type NotificationType } from '@/services/notificationService';
import {
  Bell, RefreshCw, Search, CheckCircle, Trash2,
  MailOpen, Mail, ExternalLink, CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Smart redirect based on notification content ─────────────────────────────
function getRedirectUrl(n: any): string {
  // 1. Use stored action_url from data if available
  if (n.data?.action_url) return n.data.action_url;

  const type: string = n.type ?? '';
  const title: string = (n.title ?? '').toLowerCase();
  const bookingId = n.data?.booking_id;

  // Booking notifications
  if (type === 'booking_confirmed' || type === 'booking_cancelled' ||
      type === 'booking_reminder'  || type === 'checkin_reminder'  ||
      type === 'checkout_reminder') {
    return bookingId ? `/admin/bookings/${bookingId}` : '/admin/bookings';
  }

  // Admin alerts — route by title content
  if (type === 'admin_alert') {
    if (title.includes('booking') || title.includes('check')) return '/admin/bookings';
    if (title.includes('payment'))                             return '/admin/payments';
    if (title.includes('review'))                             return '/admin/reviews';
    if (title.includes('contact') || title.includes('inquiry')) return '/admin/communications';
    return '/admin/bookings'; // default for new booking alerts
  }

  // Staff operational notifications
  if (type === 'staff_assignment' || type === 'room_maintenance') {
    if (title.includes('clean') || title.includes('inspect') || title.includes('housekeep')) return '/admin/housekeeping';
    if (title.includes('maintenance') || title.includes('repair') || title.includes('fix'))  return '/admin/maintenance';
    return '/admin/rooms';
  }

  // Other types
  if (type === 'payment_received' || type === 'payment_failed' || type === 'refund_processed') return '/admin/payments';
  if (type === 'review_request'   || type === 'review_approved' || type === 'review_rejected') return '/admin/reviews';
  if (type === 'contact_reply')   return '/admin/communications';
  if (type === 'marketing' || type === 'offer_expiry') return '/admin/offers';

  return '/admin/dashboard';
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    booking_confirmed:  { label: '🏨 Booking',       cls: 'bg-blue-100 text-blue-700' },
    booking_cancelled:  { label: '❌ Cancelled',     cls: 'bg-red-100 text-red-700' },
    booking_reminder:   { label: '⏰ Reminder',      cls: 'bg-yellow-100 text-yellow-700' },
    checkin_reminder:   { label: '🔑 Check-in',      cls: 'bg-teal-100 text-teal-700' },
    checkout_reminder:  { label: '🚪 Checkout',      cls: 'bg-slate-100 text-slate-700' },
    payment_received:   { label: '💳 Payment',       cls: 'bg-green-100 text-green-700' },
    payment_failed:     { label: '⚠️ Pmt Failed',   cls: 'bg-red-100 text-red-700' },
    refund_processed:   { label: '↩️ Refund',        cls: 'bg-purple-100 text-purple-700' },
    review_request:     { label: '⭐ Review',         cls: 'bg-yellow-100 text-yellow-700' },
    review_approved:    { label: '✅ Approved',       cls: 'bg-green-100 text-green-700' },
    review_rejected:    { label: '🚫 Rejected',      cls: 'bg-red-100 text-red-700' },
    admin_alert:        { label: '🏨 New Booking',   cls: 'bg-orange-100 text-orange-700' },
    staff_assignment:   { label: '🧹 Housekeeping',  cls: 'bg-blue-100 text-blue-700' },
    room_maintenance:   { label: '🔧 Maintenance',   cls: 'bg-yellow-100 text-yellow-700' },
    marketing:          { label: '🎁 Offer',          cls: 'bg-purple-100 text-purple-700' },
    offer_expiry:       { label: '⏳ Offer Expiry',  cls: 'bg-orange-100 text-orange-700' },
    contact_reply:      { label: '💬 Inquiry',        cls: 'bg-teal-100 text-teal-700' },
    system:             { label: '⚙️ System',         cls: 'bg-gray-100 text-gray-700' },
  };
  const cfg = map[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>;
}

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const { supabase }          = useSupabase();
  const { user }              = useAuth();
  const router                = useRouter();
  const [notifs, setNotifs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'unread' | 'read'>('all');

  // Only load THIS user's notifications — not everyone's
  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getUserNotifications(supabase, user.id, { limit: 300 });
    setNotifs(data);
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markRead = async (id: string, isRead: boolean) => {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: isRead } : n));
    toast.success(isRead ? 'Marked as read' : 'Marked as unread');
  };

  const deleteNotif = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    const { error } = await (supabase as any).from('notifications').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setNotifs(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success(`${unreadIds.length} notifications marked as read`);
  };

  const openNotif = async (n: any) => {
    if (!n.is_read) await markRead(n.id, true);
    router.push(getRedirectUrl(n));
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = notifs.filter(n => {
    if (filter === 'unread' && n.is_read)  return false;
    if (filter === 'read'   && !n.is_read) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q)  ||
        n.profiles?.full_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface flex items-center gap-2">
            <Bell size={22} className="text-primary" /> All Notifications
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {unreadCount} unread · {notifs.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-all">
              <CheckCheck size={13} /> Mark All Read
            </button>
          )}
          <button onClick={load} disabled={loading}
            className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{notifs.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-primary/20 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Unread</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{notifs.length - unreadCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Read</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 bg-white border border-outline-variant rounded-lg p-1">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                filter === f ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}>
              {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-semibold text-on-surface">Notifications ({filtered.length})</h2>
          <p className="text-xs text-on-surface-variant">Click "Open" to go to the related page</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Bell size={40} className="opacity-20" />
            <p className="font-medium">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/50">
            {filtered.map(n => (
              <div key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-primary/[0.03]' : 'hover:bg-surface/40'}`}>

                {/* Unread dot */}
                <div className="pt-1 flex-shrink-0">
                  {n.is_read
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <span className="w-2.5 h-2.5 bg-primary rounded-full inline-block mt-0.5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <TypeBadge type={n.type} />
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  {/* Open → smart redirect */}
                  <button onClick={() => openNotif(n)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-all">
                    <ExternalLink size={11} /> Open
                  </button>

                  {/* Mark Read / Unread toggle */}
                  {n.is_read ? (
                    <button onClick={() => markRead(n.id, false)}
                      title="Mark as Unread"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface transition-colors text-on-surface-variant">
                      <Mail size={11} /> Unread
                    </button>
                  ) : (
                    <button onClick={() => markRead(n.id, true)}
                      title="Mark as Read"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface transition-colors text-on-surface-variant">
                      <MailOpen size={11} /> Read
                    </button>
                  )}

                  {/* Delete */}
                  <button onClick={() => deleteNotif(n.id)}
                    title="Delete"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
