'use client';
/**
 * Phase 8 — Booking Analytics
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBookingAnalytics, downloadCSV } from '@/services/analyticsService';
import { formatINR } from '@/services/pricingService';
import { RefreshCw, Download, TrendingUp, XCircle, CalendarDays, BarChart2 } from 'lucide-react';
import Link from 'next/link';

function BarChart({ data, valueKey, labelKey, color = 'bg-primary/70', height = 130 }: {
  data: any[]; valueKey: string; labelKey: string; color?: string; height?: number;
}) {
  if (!data?.length) {
    return <div style={{ height }} className="flex items-center justify-center text-sm text-on-surface-variant">No data for this period</div>;
  }
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  return (
    <div className="flex items-end gap-0.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex-1 flex flex-col items-center justify-end h-full relative">
          <div
            className={`w-full ${color} hover:opacity-100 opacity-80 transition-opacity rounded-t-sm cursor-default`}
            style={{ height: `${Math.max((Number(d[valueKey]) / max) * 100, 2)}%` }}
          />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {String(d[labelKey]).slice(5)}: {Number(d[valueKey]).toLocaleString('en-IN')}
          </div>
          <p className="text-[8px] text-on-surface-variant mt-0.5 truncate w-full text-center leading-none">
            {String(d[labelKey]).slice(5)}
          </p>
        </div>
      ))}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

export default function BookingAnalyticsPage() {
  const { supabase } = useSupabase();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await getBookingAnalytics(supabase, days);
    setData(d);
    setLoading(false);
  }, [supabase, days]);

  useEffect(() => { load(); }, [load]);

  const daily   = data?.daily_bookings ?? [];
  const byType  = data?.by_room_type ?? [];
  const total   = data?.total_period ?? 0;
  const cancelled = data?.cancelled_period ?? 0;
  const cancelRate = total ? Math.round((cancelled / total) * 100) : 0;
  const leadTime = data?.lead_time_avg ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Booking Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Trends, conversions, and room performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex gap-1">
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  days === d ? 'bg-primary text-white border-primary' : 'border-outline-variant hover:bg-surface'
                }`}>{d}D</button>
            ))}
          </nav>
          <button onClick={() => downloadCSV(daily, `booking_analytics_${days}d.csv`, ['day','total','confirmed','cancelled','revenue'])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={load} disabled={loading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Bookings (${days}d)`,   val: total,                       icon: CalendarDays, color: 'text-blue-600' },
          { label: 'Cancellations',          val: cancelled,                   icon: XCircle,      color: 'text-red-500' },
          { label: 'Cancellation Rate',      val: `${cancelRate}%`,            icon: TrendingUp,   color: 'text-orange-600' },
          { label: `Revenue (${days}d)`,     val: formatINR(data?.revenue_period ?? 0), icon: BarChart2, color: 'text-green-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-on-surface-variant">{k.label}</p>
              <k.icon size={15} className={k.color} />
            </div>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <p className={`font-heading font-bold text-2xl ${k.color}`}>{k.val}</p>
            )}
          </div>
        ))}
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <p className="text-xs text-on-surface-variant mb-1">Avg Lead Time</p>
          <p className="font-bold text-xl">{loading ? '—' : `${leadTime} days`}</p>
          <p className="text-xs text-on-surface-variant mt-1">avg days before check-in</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <p className="text-xs text-on-surface-variant mb-1">Room Types in Period</p>
          <p className="font-bold text-xl">{loading ? '—' : byType.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">active room categories</p>
        </div>
      </div>

      {/* Daily Bookings Chart */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface mb-1">Daily Bookings — Last {days} Days</h2>
        <p className="text-xs text-on-surface-variant mb-5">Total bookings created each day</p>
        {loading ? <Skeleton className="h-36" /> : <BarChart data={daily} valueKey="total" labelKey="day" height={140} />}
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface mb-1">Daily Revenue — Last {days} Days</h2>
        <p className="text-xs text-on-surface-variant mb-5">Revenue from non-cancelled bookings (₹)</p>
        {loading ? <Skeleton className="h-36" /> : <BarChart data={daily} valueKey="revenue" labelKey="day" color="bg-green-500/70" height={140} />}
      </div>

      {/* By Room Type */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Bookings by Room Type</h2>
          <Link href="/admin/analytics/rooms" className="text-xs text-primary hover:underline">Room performance →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              {['Room Type', 'Bookings', 'Revenue', 'Share'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {loading
              ? <tr><td colSpan={4} className="px-4 py-10 text-center text-on-surface-variant"><Skeleton className="h-4 mx-auto w-32" /></td></tr>
              : byType.length === 0
                ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-on-surface-variant">No bookings yet in this period</td></tr>
                : byType.map((r: any) => {
                    const share = total ? Math.round((r.bookings / total) * 100) : 0;
                    return (
                      <tr key={r.name} className="hover:bg-surface/40">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3">{r.bookings}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">{formatINR(r.revenue)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-xs text-on-surface-variant">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>

      {/* Daily Detail Table */}
      {daily.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h2 className="font-semibold text-on-surface">Daily Detail</h2>
            <button onClick={() => downloadCSV([...daily].reverse(), `daily_bookings_${days}d.csv`)}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download size={11} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['Date', 'Bookings', 'Confirmed', 'Cancelled', 'Revenue'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {[...daily].reverse().map((d: any) => (
                  <tr key={d.day} className="hover:bg-surface/40">
                    <td className="px-4 py-2.5 text-on-surface-variant">
                      {new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{d.total}</td>
                    <td className="px-4 py-2.5 text-blue-600">{d.confirmed}</td>
                    <td className="px-4 py-2.5 text-red-500">{d.cancelled}</td>
                    <td className="px-4 py-2.5 font-semibold text-green-700">{formatINR(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
