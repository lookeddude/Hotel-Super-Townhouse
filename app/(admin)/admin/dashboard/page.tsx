'use client';
/**
 * Phase 8 — Full Business Intelligence Admin Dashboard
 * Replaces the basic operations dashboard with complete BI metrics.
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBIDashboardStats, getRevenueData, type BIDashboardStats } from '@/services/analyticsService';
import { formatINR } from '@/services/pricingService';
import {
  TrendingUp, TrendingDown, BedDouble, Users, CreditCard, Star,
  CalendarDays, CheckCircle, XCircle, Clock, RefreshCw, ArrowUpRight,
  IndianRupee, BarChart2, AlertTriangle, MessageSquare, Phone,
  Activity, ChevronUp, ChevronDown, Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface RevenueDay { day: string; revenue: number; count: number; }

/** Pure-CSS mini bar chart — no external library */
function MiniBarChart({ data, height = 120 }: { data: { value: number; label: string }[]; height?: number }) {
  if (!data.length) {
    return <div className="flex items-center justify-center text-sm text-on-surface-variant" style={{ height }}>No data yet</div>;
  }
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex-1 flex flex-col items-center justify-end h-full relative">
          <div
            className="w-full bg-primary/60 hover:bg-primary transition-colors duration-200 rounded-t-sm cursor-default"
            style={{ height: `${Math.max((d.value / max) * 100, 3)}%` }}
          />
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {d.label}: {d.value.toLocaleString('en-IN')}
          </div>
          <p className="text-[9px] text-on-surface-variant mt-0.5 truncate w-full text-center leading-none">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-green-600' : 'text-red-500'}`}>
      {pos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded-md animate-pulse ${className}`} />;
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out:'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-700',
  no_show:    'bg-orange-100 text-orange-700',
};

export default function AdminDashboardPage() {
  const { supabase } = useSupabase();
  const [stats, setStats]             = useState<BIDashboardStats | null>(null);
  const [revenue7d, setRevenue7d]     = useState<RevenueDay[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [noShowCount, setNoShowCount]  = useState<number>(0);
  const [loading, setLoading]         = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes] = await Promise.allSettled([
        getBIDashboardStats(supabase),
        getRevenueData(supabase, 7),
      ]);
      if (statsRes.status === 'fulfilled')   setStats(statsRes.value);
      if (revenueRes.status === 'fulfilled') setRevenue7d(revenueRes.value ?? []);

      const { data: bookings } = await (supabase as any)
        .from('bookings')
        .select('id, booking_reference, status, total_amount, check_in, check_out, created_at, profiles:guest_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);
      setRecentBookings(bookings ?? []);

      const { data: payments } = await (supabase as any)
        .from('payments')
        .select('id, payment_reference, status, amount, method, paid_at')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentPayments(payments ?? []);

      // Fetch no-show count directly (not in BI RPC)
      const { count: nsCount } = await (supabase as any)
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'no_show');
      setNoShowCount(nsCount ?? 0);

      setLastRefreshed(new Date());
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    const ch = (supabase as any)
      .channel('bi-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [supabase, load]);

  const chartData = revenue7d.slice(-7).map(d => ({
    value: Number(d.revenue),
    label: new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  const revenueGrowth = stats && stats.revenue_yesterday > 0
    ? Math.round(((stats.revenue_today - stats.revenue_yesterday) / stats.revenue_yesterday) * 100)
    : 0;

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Business Intelligence</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Live hotel performance · Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/analytics/bookings" className="px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">Bookings</Link>
          <Link href="/admin/analytics/rooms"    className="px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">Rooms</Link>
          <Link href="/admin/analytics/guests"   className="px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">Guests</Link>
          <Link href="/admin/reports"            className="px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">Reports</Link>
          <Link href="/admin/search" className="flex items-center gap-1 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">
            <Search size={13} /> Search
          </Link>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Revenue Row ── */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">💰 Revenue</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Revenue",  val: stats?.revenue_today,     color: 'text-green-600',  bg: 'bg-green-50',  icon: IndianRupee,  trend: revenueGrowth },
            { label: 'Yesterday',         val: stats?.revenue_yesterday, color: 'text-slate-600',  bg: 'bg-slate-50',  icon: TrendingDown },
            { label: 'Month to Date',     val: stats?.revenue_mtd,      color: 'text-blue-600',   bg: 'bg-blue-50',   icon: BarChart2 },
            { label: 'Year to Date',      val: stats?.revenue_ytd,      color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant">{k.label}</p>
                  {loading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                    <p className={`font-heading font-bold text-xl mt-1 truncate ${k.color}`}>{formatINR(k.val ?? 0)}</p>
                  )}
                  {k.trend !== undefined && !loading && <TrendBadge value={k.trend} />}
                </div>
                <div className={`shrink-0 p-2 rounded-lg ${k.bg}`}>
                  <k.icon size={17} className={k.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Room Status + Today Pulse ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Occupancy */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">🏨 Room Status</p>
            <span className="font-heading font-bold text-3xl text-primary">
              {loading ? '—' : `${stats?.occupancy_rate ?? 0}%`}
            </span>
          </div>
          <div className="h-2.5 bg-surface rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${stats?.occupancy_rate ?? 0}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Available',    val: stats?.available_rooms,    dot: 'bg-green-500',  text: 'text-green-600' },
              { label: 'Occupied',     val: stats?.occupied_rooms,     dot: 'bg-primary',    text: 'text-primary' },
              { label: 'Reserved',     val: stats?.reserved_rooms,     dot: 'bg-blue-500',   text: 'text-blue-600' },
              { label: 'Maintenance',  val: stats?.maintenance_rooms,  dot: 'bg-orange-500', text: 'text-orange-600' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                <span className="text-xs text-on-surface-variant flex-1">{r.label}</span>
                <span className={`font-bold text-sm ${r.text}`}>{loading ? '—' : (r.val ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Pulse */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">📅 Today's Pulse</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Check-ins',    val: stats?.checkins_today,    icon: CheckCircle, cls: 'bg-green-50 text-green-600' },
              { label: 'Check-outs',   val: stats?.checkouts_today,   icon: XCircle,     cls: 'bg-orange-50 text-orange-600' },
              { label: 'New Bookings', val: stats?.bookings_today,    icon: CalendarDays,cls: 'bg-blue-50 text-blue-600' },
              { label: 'Pending',      val: stats?.bookings_pending,  icon: Clock,       cls: 'bg-yellow-50 text-yellow-600' },
            ].map(c => {
              const [bg, fg] = c.cls.split(' ');
              return (
                <div key={c.label} className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
                  <c.icon size={18} className={fg} />
                  <div>
                    <p className="font-bold text-lg text-on-surface leading-none">{loading ? '—' : (c.val ?? 0)}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{c.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Revenue Chart + Payment Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-on-surface">Revenue — Last 7 Days</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Daily revenue from paid transactions</p>
            </div>
            <Link href="/admin/reports" className="text-xs text-primary hover:underline flex items-center gap-1">
              Full report <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? <Skeleton className="h-32" /> : <MiniBarChart data={chartData} height={130} />}
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="font-semibold text-on-surface mb-4">Payment Summary</p>
          <div className="space-y-3">
            {[
              { label: 'Pending Payments',  val: stats?.payments_pending_count, sub: formatINR(stats?.payments_pending_amount ?? 0), color: 'text-yellow-600' },
              { label: 'Failed Payments',   val: stats?.payments_failed_count,  sub: 'needs attention',    color: 'text-red-500' },
              { label: 'Refund Requests',   val: stats?.refunds_pending,        sub: 'in progress',        color: 'text-purple-600' },
              { label: 'Avg Booking Value', val: formatINR(stats?.avg_booking_value ?? 0), color: 'text-green-600' },
              { label: 'Avg Stay',          val: `${stats?.avg_stay_duration ?? 0} nights`, color: 'text-blue-600' },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-on-surface-variant truncate">{p.label}</p>
                  {p.sub && <p className="text-[10px] text-on-surface-variant/60">{p.sub}</p>}
                </div>
                <p className={`font-bold text-sm shrink-0 ${p.color}`}>{loading ? '—' : p.val}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/payments" className="block mt-3 text-xs text-primary hover:underline">All payments →</Link>
        </div>
      </div>

      {/* ── Booking Status KPI Row ── */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">📋 Booking Overview</p>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
          {[
            { label: 'Total',      val: stats?.bookings_total,     icon: CalendarDays,   color: 'text-on-surface' },
            { label: 'Confirmed',  val: stats?.bookings_confirmed, icon: CheckCircle,    color: 'text-blue-600' },
            { label: 'Checked In', val: stats?.bookings_checkedin, icon: Activity,       color: 'text-green-600' },
            { label: 'Completed',  val: stats?.bookings_completed, icon: CheckCircle,    color: 'text-slate-600' },
            { label: 'Cancelled',  val: stats?.bookings_cancelled, icon: XCircle,        color: 'text-red-500' },
            { label: 'No Show',    val: noShowCount,               icon: AlertTriangle,  color: 'text-orange-600' },
            { label: 'Cancel Rate',val: `${stats?.cancellation_rate ?? 0}%`, icon: AlertTriangle, color: 'text-orange-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-3 text-center">
              <k.icon size={16} className={`mx-auto mb-1 ${k.color}`} />
              <p className={`font-bold text-xl ${k.color}`}>{loading ? '—' : (k.val ?? 0)}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Bookings + Right Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bookings table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <p className="font-semibold text-on-surface">Recent Bookings</p>
            <Link href="/admin/bookings" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['Reference', 'Guest', 'Dates', 'Amount', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-4" /></td></tr>
                    ))
                  : recentBookings.map(b => {
                      const name = Array.isArray(b.profiles) ? b.profiles[0]?.full_name : b.profiles?.full_name;
                      return (
                        <tr key={b.id} className="hover:bg-surface/50">
                          <td className="px-4 py-2.5">
                            <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs text-primary hover:underline">
                              {b.booking_reference}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium max-w-[110px] truncate">{name ?? '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                            {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-xs whitespace-nowrap">{formatINR(b.total_amount)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BOOKING_STATUS_COLORS[b.status] ?? 'bg-gray-100'}`}>
                              {b.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <p className="font-semibold text-sm text-on-surface">Recent Transactions</p>
              <Link href="/admin/payments" className="text-xs text-primary hover:underline">All</Link>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-4 py-3"><Skeleton className="h-8" /></div>)
                : recentPayments.map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-on-surface-variant truncate">{p.payment_reference}</p>
                        <p className="text-xs text-on-surface-variant capitalize mt-0.5">{p.method?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatINR(p.amount)}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          p.status === 'paid'    ? 'bg-green-100 text-green-700' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Guest & Review KPIs */}
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="font-semibold text-sm text-on-surface mb-3">Guests & Reviews</p>
            <div className="space-y-2.5">
              {[
                { label: 'Total Guests',     val: stats?.total_guests,     icon: Users },
                { label: 'New This Month',   val: stats?.new_guests_mtd,   icon: Users },
                { label: 'Avg Rating',       val: `${stats?.avg_rating ?? 0} ★`, icon: Star },
                { label: 'Pending Reviews',  val: stats?.pending_reviews,  icon: MessageSquare },
                { label: 'Open Inquiries',   val: stats?.pending_contacts, icon: Phone },
              ].map(g => (
                <div key={g.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <g.icon size={12} />{g.label}
                  </div>
                  <span className="font-bold text-sm">{loading ? '—' : (g.val ?? 0)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Link href="/admin/analytics/guests" className="text-xs text-primary hover:underline">Guest analytics →</Link>
              <Link href="/admin/reviews" className="text-xs text-primary hover:underline ml-2">Reviews →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <p className="font-semibold text-on-surface mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '+ New Booking',        href: '/admin/bookings/new',          primary: true },
            { label: 'All Bookings',          href: '/admin/bookings' },
            { label: 'Payments',              href: '/admin/payments' },
            { label: 'Booking Analytics',     href: '/admin/analytics/bookings' },
            { label: 'Room Performance',      href: '/admin/analytics/rooms' },
            { label: 'Guest Analytics',       href: '/admin/analytics/guests' },
            { label: 'Revenue Reports',       href: '/admin/reports' },
            { label: 'Moderate Reviews',      href: '/admin/reviews' },
            { label: 'Manage Rooms',          href: '/admin/rooms' },
            { label: 'Gallery',               href: '/admin/gallery' },
            { label: 'Offers & Packages',     href: '/admin/offers' },
            { label: 'CMS / Content',         href: '/admin/cms' },
            { label: '🔍 Global Search',      href: '/admin/search' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                a.primary
                  ? 'bg-primary text-white hover:bg-primary-dark font-semibold'
                  : 'bg-surface border border-outline-variant hover:bg-primary hover:text-white hover:border-primary'
              }`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
