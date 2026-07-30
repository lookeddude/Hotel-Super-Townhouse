'use client';
/**
 * Phase 8 — Room Performance Analytics
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getRoomAnalytics, downloadCSV } from '@/services/analyticsService';
import { formatINR } from '@/services/pricingService';
import { RefreshCw, Download, BedDouble, TrendingUp, Wrench, Trophy } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
}

export default function RoomAnalyticsPage() {
  const { supabase } = useSupabase();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await getRoomAnalytics(supabase, days);
    setData(d);
    setLoading(false);
  }, [supabase, days]);

  useEffect(() => { load(); }, [load]);

  const typePerf  = data?.room_type_performance ?? [];
  const topRooms  = data?.top_rooms ?? [];
  const maxRev    = Math.max(...typePerf.map((r: any) => Number(r.total_revenue)), 1);
  const totalRev  = typePerf.reduce((s: number, r: any) => s + Number(r.total_revenue), 0);
  const totalBk   = typePerf.reduce((s: number, r: any) => s + Number(r.total_bookings), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Room Performance</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Revenue, utilization, and occupancy by room type</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex gap-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  days === d ? 'bg-primary text-white border-primary' : 'border-outline-variant hover:bg-surface'
                }`}>{d}D</button>
            ))}
          </nav>
          <button onClick={() => downloadCSV(typePerf, `room_performance_${days}d.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <Download size={13} /> CSV
          </button>
          <button onClick={load} disabled={loading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <div className="flex items-center gap-2 mb-2">
            <BedDouble size={15} className="text-blue-600" />
            <p className="text-xs text-on-surface-variant">Room Types</p>
          </div>
          <p className="font-bold text-2xl text-blue-600">{typePerf.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-green-600" />
            <p className="text-xs text-on-surface-variant">Revenue ({days}d)</p>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : (
            <p className="font-bold text-2xl text-green-600">{formatINR(totalRev)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={15} className="text-orange-500" />
            <p className="text-xs text-on-surface-variant">Maintenance ({days}d)</p>
          </div>
          <p className="font-bold text-2xl text-orange-500">{loading ? '—' : (data?.maintenance_count ?? 0)}</p>
        </div>
      </div>

      {/* Revenue Breakdown Bars */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface mb-1">Revenue by Room Type — Last {days} Days</h2>
        <p className="text-xs text-on-surface-variant mb-5">Relative revenue contribution of each room category</p>
        {loading
          ? <Skeleton className="h-48" />
          : typePerf.length === 0
            ? <p className="py-10 text-center text-sm text-on-surface-variant">No data for this period</p>
            : (
              <div className="space-y-5">
                {typePerf.map((r: any, i: number) => {
                  const pct = totalRev ? Math.round((Number(r.total_revenue) / totalRev) * 100) : 0;
                  const barW = Math.max((Number(r.total_revenue) / maxRev) * 100, 2);
                  const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];
                  return (
                    <div key={r.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                          <span className="text-sm font-medium text-on-surface">{r.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-green-700">{formatINR(r.total_revenue)}</span>
                          <span className="text-xs text-on-surface-variant ml-2">({r.total_bookings} bk · {pct}%)</span>
                        </div>
                      </div>
                      <div className="h-3 bg-surface rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>

      {/* Room Type Detail Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Room Type Performance</h2>
          <span className="text-xs text-on-surface-variant">{totalBk} total bookings in period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {['Room Type', 'Base Price', 'Bookings', 'Revenue', 'Utilization'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading
                ? <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">Loading…</td></tr>
                : typePerf.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-on-surface-variant">No data yet</td></tr>
                  : typePerf.map((r: any, i: number) => (
                      <tr key={r.name} className="hover:bg-surface/40">
                        <td className="px-4 py-3 font-medium">{i === 0 && '🏆 '}{r.name}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{formatINR(r.base_price)}/night</td>
                        <td className="px-4 py-3 font-semibold">{r.total_bookings}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">{formatINR(r.total_revenue)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(Number(r.utilization_rate), 100)}%` }} />
                            </div>
                            <span className="text-xs text-on-surface-variant">{r.utilization_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Rooms Leaderboard */}
      {topRooms.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-outline-variant">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-on-surface">Top Performing Rooms — Last {days} Days</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['Rank', 'Room #', 'Type', 'Bookings', 'Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {topRooms.map((r: any, i: number) => (
                  <tr key={r.room_number} className="hover:bg-surface/40">
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">#{r.room_number}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{r.type_name}</td>
                    <td className="px-4 py-3">{r.bookings}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatINR(r.revenue)}</td>
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
