'use client';
/**
 * Phase 9 — Admin All-Notifications View
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getAllNotificationsAdmin, type NotificationType } from '@/services/notificationService';
import { downloadCSV } from '@/services/analyticsService';
import {
  Bell, RefreshCw, Download, Search,
  CheckCircle, XCircle, CreditCard, Star, CalendarDays, Tag, AlertTriangle,
} from 'lucide-react';

function TypeBadge({ type }: { type: NotificationType }) {
  const map: Record<string, { label: string; cls: string }> = {
    booking_confirmed:  { label: 'Booking',  cls: 'bg-blue-100 text-blue-700' },
    booking_cancelled:  { label: 'Cancel',   cls: 'bg-red-100 text-red-700' },
    payment_received:   { label: 'Payment',  cls: 'bg-green-100 text-green-700' },
    payment_failed:     { label: 'Pmt Fail', cls: 'bg-red-100 text-red-700' },
    review_request:     { label: 'Review',   cls: 'bg-yellow-100 text-yellow-700' },
    review_approved:    { label: 'Review ✓', cls: 'bg-green-100 text-green-700' },
    admin_alert:        { label: 'Alert',    cls: 'bg-orange-100 text-orange-700' },
    marketing:          { label: 'Promo',    cls: 'bg-purple-100 text-purple-700' },
    checkin_reminder:   { label: 'Check-in', cls: 'bg-teal-100 text-teal-700' },
    checkout_reminder:  { label: 'Checkout', cls: 'bg-slate-100 text-slate-700' },
  };
  const cfg = map[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function AdminNotificationsPage() {
  const { supabase }             = useSupabase();
  const [notifs,   setNotifs]    = useState<any[]>([]);
  const [filtered, setFiltered]  = useState<any[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [search,   setSearch]    = useState('');
  const [readFilter, setReadFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllNotificationsAdmin(supabase, { limit: 300 });
    setNotifs(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let r = notifs;
    if (readFilter === 'unread') r = r.filter(n => !n.is_read);
    if (readFilter === 'read')   r = r.filter(n => n.is_read);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q)  ||
        n.profiles?.full_name?.toLowerCase().includes(q) ||
        n.profiles?.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(r);
  }, [notifs, readFilter, search]);

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">All Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {unread} unread · {notifs.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(filtered.map(n => ({
              type: n.type, title: n.title, user: n.profiles?.full_name, read: n.is_read, created: n.created_at
            })), 'notifications.csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>
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
        <div className="bg-white rounded-xl border border-outline-variant p-4 text-center">
          <p className="text-2xl font-bold text-primary">{unread}</p>
          <p className="text-xs text-on-surface-variant mt-1">Unread</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{notifs.length - unread}</p>
          <p className="text-xs text-on-surface-variant mt-1">Read</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications, users…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                readFilter === f ? 'bg-primary text-white border-primary' : 'border-outline-variant hover:bg-surface'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Notifications ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {['Status', 'Type', 'Title', 'Recipient', 'Channel', 'Time'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading
                ? <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Loading…</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-on-surface-variant">No notifications</td></tr>
                  : filtered.map(n => (
                      <tr key={n.id} className={`hover:bg-surface/40 transition-colors ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}>
                        <td className="px-4 py-2.5">
                          {n.is_read
                            ? <CheckCircle size={14} className="text-green-500" />
                            : <span className="w-2 h-2 bg-primary rounded-full inline-block" />}
                        </td>
                        <td className="px-4 py-2.5"><TypeBadge type={n.type} /></td>
                        <td className="px-4 py-2.5 max-w-[200px]">
                          <p className="font-medium text-xs truncate">{n.title}</p>
                          <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{n.body}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          <p className="font-medium">{n.profiles?.full_name ?? '—'}</p>
                          <p className="text-[10px] text-on-surface-variant">{n.profiles?.email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono text-on-surface-variant">{n.channel}</td>
                        <td className="px-4 py-2.5 text-xs text-on-surface-variant">{timeAgo(n.created_at)}</td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
