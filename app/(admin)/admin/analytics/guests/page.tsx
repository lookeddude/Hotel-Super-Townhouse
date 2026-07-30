'use client';
/**
 * Phase 8 — Guest Analytics
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getGuestAnalytics, downloadCSV } from '@/services/analyticsService';
import { formatINR } from '@/services/pricingService';
import { RefreshCw, Download, Users, Star, TrendingUp, Clock, RotateCcw } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

export default function GuestAnalyticsPage() {
  const { supabase } = useSupabase();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await getGuestAnalytics(supabase, days);
    setData(d);
    setLoading(false);
  }, [supabase, days]);

  useEffect(() => { load(); }, [load]);

  const topGuests      = data?.top_guests ?? [];
  const reviewBreakdown = data?.review_breakdown ?? [];
  const totalReviews   = reviewBreakdown.reduce((s: number, r: any) => s + Number(r.count), 0);
  const retPct         = data?.total_guests
    ? Math.round(((data.returning_guests ?? 0) / data.total_guests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Guest Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Acquisition, retention, and satisfaction</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex gap-1">
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  days === d ? 'bg-primary text-white border-primary' : 'border-outline-variant hover:bg-surface'
                }`}>{d}D</button>
            ))}
          </nav>
          <button onClick={() => downloadCSV(topGuests, `top_guests_${days}d.csv`)}
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
          { label: 'Total Guests',     val: data?.total_guests,     icon: Users,     color: 'text-blue-600' },
          { label: `New (${days}d)`,   val: data?.new_guests,       icon: TrendingUp, color: 'text-green-600' },
          { label: 'Returning Guests', val: data?.returning_guests, icon: RotateCcw, color: 'text-purple-600' },
          { label: 'Avg Stay',         val: `${data?.avg_stay ?? 0} nights`, icon: Clock, color: 'text-orange-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-on-surface-variant">{k.label}</p>
              <k.icon size={15} className={k.color} />
            </div>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <p className={`font-heading font-bold text-2xl ${k.color}`}>{k.val ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      {/* Retention bar */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-on-surface">Guest Retention Rate</h2>
          <span className="font-bold text-xl text-purple-600">{loading ? '—' : `${retPct}%`}</span>
        </div>
        <div className="h-3 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${retPct}%` }} />
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          {data?.returning_guests ?? 0} returning out of {data?.total_guests ?? 0} total guests
        </p>
      </div>

      {/* Satisfaction + Top Guests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rating breakdown */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-on-surface mb-4">Guest Satisfaction</h2>
          {loading ? <Skeleton className="h-40" /> : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-5xl font-heading font-bold text-yellow-500">{data?.satisfaction ?? '—'}</p>
                <div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={20} className={
                        i < Math.round(data?.satisfaction ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'
                      } />
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Average rating · {totalReviews} reviews</p>
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const found = reviewBreakdown.find((r: any) => Number(r.rating) === rating);
                  const count = found ? Number(found.count) : 0;
                  const pct   = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant w-6 text-right">{rating}★</span>
                      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-on-surface-variant w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Top Guests by LTV */}
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h2 className="font-semibold text-on-surface">Top Guests by Lifetime Value</h2>
            <button onClick={() => downloadCSV(topGuests, 'top_guests.csv')} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Download size={11} /> CSV
            </button>
          </div>
          <div className="divide-y divide-outline-variant/50">
            {loading
              ? <div className="p-6"><Skeleton className="h-40" /></div>
              : topGuests.length === 0
                ? <div className="py-14 text-center text-sm text-on-surface-variant">No guest data yet</div>
                : topGuests.slice(0, 8).map((g: any, i: number) => (
                    <div key={g.email} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.full_name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{g.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-green-700">{formatINR(g.lifetime_value)}</p>
                        <p className="text-xs text-on-surface-variant">{g.total_bookings} stays</p>
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
