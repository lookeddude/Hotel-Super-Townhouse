'use client';
/**
 * app/(admin)/admin/reports/page.tsx
 * Revenue reports — date range, daily revenue chart, method breakdown, CSV export.
 * Fixed: dynamic p_days, quick-range auto-fetch, IST local date, named loadReports.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { Download, RefreshCw, TrendingUp, BarChart2, AlertTriangle } from 'lucide-react';

interface DailyRevenue { day: string; revenue: number; count: number; }
interface Summary { total: number; count: number; avg: number; online: number; cash: number; refunds: number; }
interface NoShowData { count: number; lostRevenue: number; rate: number; bookings: any[]; }

/** Get today's date in local IST as YYYY-MM-DD (avoids UTC offset issues) */
function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLocalDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminReportsPage() {
  const { supabase } = useSupabase();

  const [dateFrom, setDateFrom] = useState(() => getLocalDaysAgo(30));
  const [dateTo,   setDateTo]   = useState(() => getLocalToday());
  const [daily,    setDaily]    = useState<DailyRevenue[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [noShowData, setNoShowData] = useState<NoShowData | null>(null);
  const [loading,  setLoading]  = useState(false);

  /**
   * loadReports — accepts optional override dates so quick-range buttons
   * can pass new dates directly without waiting for state to update.
   */
  const loadReports = useCallback(async (overrideFrom?: string, overrideTo?: string) => {
    const from = overrideFrom ?? dateFrom;
    const to   = overrideTo   ?? dateTo;
    setLoading(true);
    const db = supabase as any;

    // Compute p_days dynamically so we never miss data for long ranges
    const msPerDay  = 1000 * 60 * 60 * 24;
    const daysDiff  = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / msPerDay);
    const pDays     = Math.max(daysDiff + 2, 7); // buffer of +2 days

    // ── Daily revenue from RPC ────────────────────────────────────────────
    const { data: dailyRaw } = await db.rpc('get_daily_revenue', { p_days: pDays });
    const filtered = (dailyRaw ?? []).filter((d: DailyRevenue) => d.day >= from && d.day <= to);
    setDaily(filtered);

    // ── Summary stats from payments table ────────────────────────────────
    const { data: payments } = await db
      .from('payments')
      .select('amount, method, status, refund_amount')
      .eq('status', 'paid')
      .gte('paid_at', from)
      .lte('paid_at', to + 'T23:59:59.999+05:30');

    if (payments) {
      const total   = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const online  = payments
        .filter((p: any) => ['online', 'upi', 'card', 'bank_transfer'].includes(p.method))
        .reduce((s: number, p: any) => s + Number(p.amount), 0);
      const cash    = payments
        .filter((p: any) => ['cash', 'pay_at_hotel'].includes(p.method))
        .reduce((s: number, p: any) => s + Number(p.amount), 0);
      const refunds = payments.reduce((s: number, p: any) => s + Number(p.refund_amount ?? 0), 0);
      setSummary({ total, count: payments.length, avg: payments.length ? total / payments.length : 0, online, cash, refunds });
    } else {
      setSummary(null);
    }

    // ── No-show analysis ──────────────────────────────────────────────────
    const { data: noShows } = await db
      .from('bookings')
      .select('id, booking_reference, check_in, check_out, total_amount, profiles:guest_id(full_name)')
      .eq('status', 'no_show')
      .gte('check_in', from)
      .lte('check_in', to);

    if (noShows) {
      const nsLost = noShows.reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
      const { count: totalInRange } = await db
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('check_in', from)
        .lte('check_in', to)
        .neq('status', 'cancelled');
      const rate = totalInRange ? Math.round((noShows.length / totalInRange) * 100) : 0;
      setNoShowData({ count: noShows.length, lostRevenue: nsLost, rate, bookings: noShows });
    }

    setLoading(false);
  }, [supabase, dateFrom, dateTo]);

  // Run once on mount
  useEffect(() => { loadReports(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CSV export — revenue daily + summary row ──────────────────────────
  function exportRevenueCSV() {
    const rows: string[][] = [
      ['Date', 'Revenue (INR)', 'Transactions', 'Avg Per Transaction'],
    ];
    daily.forEach(d => rows.push([
      d.day,
      String(Number(d.revenue).toFixed(2)),
      String(d.count),
      d.count > 0 ? String((Number(d.revenue) / d.count).toFixed(2)) : '0',
    ]));
    // Summary row
    const totalRev = daily.reduce((s, d) => s + Number(d.revenue), 0);
    const totalTxn = daily.reduce((s, d) => s + d.count, 0);
    rows.push(['TOTAL', String(totalRev.toFixed(2)), String(totalTxn), totalTxn > 0 ? String((totalRev / totalTxn).toFixed(2)) : '0']);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `revenue_${dateFrom}_to_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CSV export — no-show bookings ─────────────────────────────────────
  function exportNoShowCSV() {
    if (!noShowData?.bookings.length) return;
    const rows: string[][] = [
      ['Ref #', 'Guest Name', 'Check-In', 'Check-Out', 'Lost Revenue (INR)'],
    ];
    noShowData.bookings.forEach((b: any) => {
      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      rows.push([
        b.booking_reference ?? b.id?.slice(0, 8),
        profile?.full_name ?? 'Unknown',
        b.check_in,
        b.check_out,
        String(Number(b.total_amount ?? 0).toFixed(2)),
      ]);
    });
    // Summary row
    rows.push(['', '', '', 'TOTAL LOST', String(noShowData.lostRevenue.toFixed(2))]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `no_shows_${dateFrom}_to_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const maxRevenue = Math.max(...daily.map(d => Number(d.revenue)), 1);

  // Quick range helper
  const applyQuickRange = (days: number) => {
    const newFrom = getLocalDaysAgo(days);
    const newTo   = getLocalToday();
    setDateFrom(newFrom);
    setDateTo(newTo);
    loadReports(newFrom, newTo); // pass directly — avoids stale state
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Revenue Reports</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Financial analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadReports()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportRevenueCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-xl border border-outline-variant p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={() => loadReports()} disabled={loading}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60">
          {loading ? 'Loading…' : 'Generate'}
        </button>
        {/* Quick ranges — these auto-fetch immediately */}
        <div className="flex gap-1.5">
          {[
            { label: '7D',  days: 7 },
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
            { label: 'MTD', days: new Date().getDate() - 1 },
          ].map(({ label, days }) => (
            <button key={label}
              onClick={() => applyQuickRange(days)}
              disabled={loading}
              className="px-3 py-2 text-sm border border-outline-variant rounded-lg hover:bg-surface transition-colors disabled:opacity-50">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue',     value: formatINR(summary.total),   color: 'text-green-600' },
            { label: 'Transactions',      value: summary.count,               color: 'text-blue-600' },
            { label: 'Avg. Per Booking',  value: formatINR(summary.avg),      color: 'text-on-surface' },
            { label: 'Online Payments',   value: formatINR(summary.online),   color: 'text-purple-600' },
            { label: 'Cash / At Hotel',   value: formatINR(summary.cash),     color: 'text-amber-600' },
            { label: 'Total Refunded',    value: formatINR(summary.refunds),  color: 'text-red-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-outline-variant p-5">
              <p className="text-sm text-on-surface-variant">{k.label}</p>
              <p className={`font-heading font-bold text-2xl mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── No Show Analysis ── */}
      {noShowData !== null && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" /> No Show Analysis
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">
                Bookings where guest did not arrive · {dateFrom} to {dateTo}
              </p>
            </div>
            {noShowData.bookings.length > 0 && (
              <button onClick={exportNoShowCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                <Download size={12} /> Export CSV
              </button>
            )}
          </div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 p-5 border-b border-orange-100">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{noShowData.count}</p>
              <p className="text-xs text-on-surface-variant mt-1">No Shows</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{noShowData.rate}%</p>
              <p className="text-xs text-on-surface-variant mt-1">No Show Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{formatINR(noShowData.lostRevenue)}</p>
              <p className="text-xs text-on-surface-variant mt-1">Lost Revenue</p>
            </div>
          </div>
          {/* No-show bookings table */}
          {noShowData.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr>
                    {['Ref #', 'Guest', 'Check-in', 'Check-out', 'Lost Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {noShowData.bookings.map((b: any) => {
                    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                    return (
                      <tr key={b.id} className="hover:bg-surface/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-primary">#{b.booking_reference ?? b.id?.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-medium">{profile?.full_name ?? 'Guest'}</td>
                        <td className="px-4 py-3">{new Date(b.check_in + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3">{new Date(b.check_out + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{formatINR(b.total_amount ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              ✅ No no-shows recorded in this period
            </div>
          )}
        </div>
      )}

      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface mb-6">
          Daily Revenue
          <span className="text-xs font-normal text-on-surface-variant ml-2">({dateFrom} → {dateTo})</span>
        </h2>
        {loading ? (
          <div className="h-48 bg-surface rounded-lg animate-pulse" />
        ) : daily.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
            No revenue data for selected period
          </div>
        ) : (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="flex">
              <div className="w-20 shrink-0 flex flex-col justify-between text-right pr-3 h-48 text-xs text-on-surface-variant">
                <span>{formatINR(maxRevenue)}</span>
                <span>{formatINR(maxRevenue / 2)}</span>
                <span>₹0</span>
              </div>
              {/* Bars */}
              <div className="flex-1 flex items-end gap-0.5 h-48 overflow-x-auto">
                {daily.map((d, i) => {
                  const height = Math.max((Number(d.revenue) / maxRevenue) * 100, 2);
                  return (
                    <div key={i} className="group flex-1 min-w-[4px] flex flex-col items-center justify-end h-full relative">
                      <div
                        className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t-sm cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${d.day}: ${formatINR(d.revenue)} (${d.count} txn)`}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 bg-on-surface text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.day}<br />{formatINR(d.revenue)} · {d.count} txn
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X-axis labels — show every 7th */}
            <div className="flex mt-2 pl-20">
              {daily.map((d, i) => (
                <div key={i} className={`flex-1 min-w-[4px] text-center text-[9px] text-on-surface-variant ${i % 7 === 0 ? '' : 'opacity-0'}`}>
                  {new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Breakdown Table */}
      {daily.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Daily Breakdown</h2>
            <button onClick={exportRevenueCSV}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download size={11} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['Date', 'Revenue', 'Transactions', 'Avg. Per Transaction'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {[...daily].reverse().map(d => (
                  <tr key={d.day} className="hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatINR(d.revenue)}</td>
                    <td className="px-4 py-3">{d.count}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{d.count > 0 ? formatINR(Number(d.revenue) / d.count) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface border-t-2 border-outline-variant">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatINR(daily.reduce((s, d) => s + Number(d.revenue), 0))}</td>
                  <td className="px-4 py-3 font-bold">{daily.reduce((s, d) => s + d.count, 0)}</td>
                  <td className="px-4 py-3 font-bold">{formatINR(summary?.avg ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
