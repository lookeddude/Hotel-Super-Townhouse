'use client';
/**
 * app/(admin)/admin/reports/page.tsx
 * Finance & Revenue Reports — queries bookings table directly for accurate data.
 * Fixed: uses bookings.total_amount + check_in date (not payments table) for revenue.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { Download, RefreshCw, TrendingUp, BarChart2, AlertTriangle, Banknote, Wifi, IndianRupee } from 'lucide-react';

interface DailyRevenue { day: string; revenue: number; count: number; }
interface Summary {
  totalRevenue: number; totalBookings: number; avgValue: number;
  confirmedCount: number; checkedInCount: number; checkedOutCount: number; noShowCount: number;
  onlineRevenue: number; cashRevenue: number; pendingRevenue: number;
}
interface NoShowData { count: number; lostRevenue: number; rate: number; bookings: any[]; }

function getLocalDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminReportsPage() {
  const { supabase } = useSupabase();

  const [dateFrom, setDateFrom] = useState(() => getLocalDate(-30));
  const [dateTo,   setDateTo]   = useState(() => getLocalDate(0));
  const [daily,    setDaily]    = useState<DailyRevenue[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [noShowData, setNoShowData] = useState<NoShowData | null>(null);
  const [loading,  setLoading]  = useState(false);

  const loadReports = useCallback(async (overrideFrom?: string, overrideTo?: string) => {
    const from = overrideFrom ?? dateFrom;
    const to   = overrideTo   ?? dateTo;
    setLoading(true);
    const db = supabase as any;

    // ── 1. All bookings in range (by check_in date) ────────────────────────
    const { data: bookings, error: bErr } = await db
      .from('bookings')
      .select('id, check_in, total_amount, status, payment_status')
      .gte('check_in', from)
      .lte('check_in', to)
      .order('check_in', { ascending: true });

    if (!bErr && bookings) {
      const active = bookings.filter((b: any) => !['cancelled'].includes(b.status));
      const noShows = bookings.filter((b: any) => b.status === 'no_show');
      const revenue = active.filter((b: any) => b.status !== 'no_show');

      // ── Daily revenue aggregation ─────────────────────────────────────
      const dayMap: Record<string, DailyRevenue> = {};
      revenue.forEach((b: any) => {
        const day = b.check_in;
        if (!dayMap[day]) dayMap[day] = { day, revenue: 0, count: 0 };
        dayMap[day].revenue += Number(b.total_amount ?? 0);
        dayMap[day].count   += 1;
      });
      setDaily(Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day)));

      // ── Summary stats ─────────────────────────────────────────────────
      const totalRevenue    = revenue.reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
      const confirmedCount  = bookings.filter((b: any) => b.status === 'confirmed').length;
      const checkedInCount  = bookings.filter((b: any) => b.status === 'checked_in').length;
      const checkedOutCount = bookings.filter((b: any) => b.status === 'checked_out').length;
      const noShowCount     = noShows.length;

      // Payment breakdown — from payments table (actual collected payments)
      const { data: payments } = await db
        .from('payments')
        .select('amount, method, status')
        .eq('status', 'paid')
        .gte('paid_at', from)
        .lte('paid_at', to + 'T23:59:59');

      const onlineRevenue = (payments ?? [])
        .filter((p: any) => ['online', 'upi', 'card', 'bank_transfer'].includes(p.method))
        .reduce((s: number, p: any) => s + Number(p.amount), 0);
      const cashRevenue = (payments ?? [])
        .filter((p: any) => ['cash', 'pay_at_hotel'].includes(p.method))
        .reduce((s: number, p: any) => s + Number(p.amount), 0);

      // Pending = confirmed/checked_in bookings where payment_status !== 'paid'
      const pendingRevenue = bookings
        .filter((b: any) => ['pending', 'confirmed', 'checked_in'].includes(b.status) && b.payment_status !== 'paid')
        .reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);

      setSummary({
        totalRevenue, totalBookings: active.length,
        avgValue: active.length ? totalRevenue / active.length : 0,
        confirmedCount, checkedInCount, checkedOutCount, noShowCount,
        onlineRevenue, cashRevenue, pendingRevenue,
      });

      // ── No-show analysis ──────────────────────────────────────────────
      const { data: noShowDetails } = await db
        .from('bookings')
        .select('id, booking_reference, check_in, check_out, total_amount, profiles:guest_id(full_name)')
        .eq('status', 'no_show')
        .gte('check_in', from)
        .lte('check_in', to);

      if (noShowDetails) {
        const nsLost = noShowDetails.reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
        const totalInRange = bookings.filter((b: any) => b.status !== 'cancelled').length;
        const rate = totalInRange ? Math.round((noShowDetails.length / totalInRange) * 100) : 0;
        setNoShowData({ count: noShowDetails.length, lostRevenue: nsLost, rate, bookings: noShowDetails });
      }
    }

    setLoading(false);
  }, [supabase, dateFrom, dateTo]);

  useEffect(() => { loadReports(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CSV: Revenue ─────────────────────────────────────────────────────────
  function exportRevenueCSV() {
    const header = ['Date', 'Bookings', 'Revenue (INR)', 'Avg Per Booking (INR)'];
    const rows = daily.map(d => [
      d.day,
      String(d.count),
      Number(d.revenue).toFixed(2),
      d.count > 0 ? (Number(d.revenue) / d.count).toFixed(2) : '0',
    ]);
    const total = daily.reduce((s, d) => s + Number(d.revenue), 0);
    const totalCount = daily.reduce((s, d) => s + d.count, 0);
    rows.push(['TOTAL', String(totalCount), total.toFixed(2), totalCount > 0 ? (total / totalCount).toFixed(2) : '0']);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `revenue_${dateFrom}_to_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CSV: No-shows ────────────────────────────────────────────────────────
  function exportNoShowCSV() {
    if (!noShowData?.bookings.length) return;
    const header = ['Ref #', 'Guest Name', 'Check-In', 'Check-Out', 'Lost Revenue (INR)'];
    const rows = noShowData.bookings.map((b: any) => {
      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      return [b.booking_reference ?? b.id?.slice(0, 8), profile?.full_name ?? 'Unknown', b.check_in, b.check_out, Number(b.total_amount ?? 0).toFixed(2)];
    });
    rows.push(['', '', '', 'TOTAL LOST', noShowData.lostRevenue.toFixed(2)]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `no_shows_${dateFrom}_to_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const applyRange = (days: number) => {
    const newFrom = getLocalDate(-days);
    const newTo   = getLocalDate(0);
    setDateFrom(newFrom);
    setDateTo(newTo);
    loadReports(newFrom, newTo);
  };

  const maxRevenue = Math.max(...daily.map(d => Number(d.revenue)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Finance & Reports</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Revenue and financial analytics by check-in date</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadReports()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportRevenueCSV} disabled={!daily.length}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-xl border border-outline-variant p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">From (Check-in)</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">To (Check-in)</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={() => loadReports()} disabled={loading}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60">
          {loading ? 'Loading…' : 'Generate'}
        </button>
        <div className="flex gap-1.5">
          {[{ label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }, { label: 'MTD', days: new Date().getDate() - 1 }].map(({ label, days }) => (
            <button key={label} onClick={() => applyRange(days)} disabled={loading}
              className="px-3 py-2 text-sm border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-50">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-outline-variant p-5 lg:col-span-2">
            <p className="text-sm text-on-surface-variant">Total Revenue</p>
            <p className="font-heading font-bold text-3xl text-green-600 mt-1">{formatINR(summary.totalRevenue)}</p>
            <p className="text-xs text-on-surface-variant mt-1">{summary.totalBookings} bookings · avg {formatINR(summary.avgValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-5">
            <p className="text-sm text-on-surface-variant">Collected (Paid)</p>
            <p className="font-heading font-bold text-2xl text-blue-600 mt-1">{formatINR(summary.onlineRevenue + summary.cashRevenue)}</p>
            <div className="flex gap-3 mt-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1"><Wifi size={10} /> Online: {formatINR(summary.onlineRevenue)}</span>
              <span className="flex items-center gap-1"><Banknote size={10} /> Cash: {formatINR(summary.cashRevenue)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-5">
            <p className="text-sm text-on-surface-variant">Pending Collection</p>
            <p className="font-heading font-bold text-2xl text-amber-600 mt-1">{formatINR(summary.pendingRevenue)}</p>
            <p className="text-xs text-on-surface-variant mt-1">Pay at hotel — not yet collected</p>
          </div>
        </div>
      )}

      {/* Booking Status breakdown */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Confirmed',   val: summary.confirmedCount,  color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Checked In',  val: summary.checkedInCount,  color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Checked Out', val: summary.checkedOutCount, color: 'text-gray-600',   bg: 'bg-gray-50' },
            { label: 'No Shows',    val: summary.noShowCount,     color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(k => (
            <div key={k.label} className={`${k.bg} rounded-xl border border-outline-variant p-4`}>
              <p className="text-xs text-on-surface-variant">{k.label}</p>
              <p className={`font-heading font-bold text-2xl mt-1 ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* No Show Analysis */}
      {noShowData !== null && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" /> No Show Analysis
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">{dateFrom} to {dateTo}</p>
            </div>
            {noShowData.bookings.length > 0 && (
              <button onClick={exportNoShowCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100">
                <Download size={12} /> Export CSV
              </button>
            )}
          </div>
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
                      <tr key={b.id} className="hover:bg-surface/40">
                        <td className="px-4 py-3 font-mono text-xs text-primary">#{b.booking_reference ?? b.id?.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-medium">{profile?.full_name ?? 'Guest'}</td>
                        <td className="px-4 py-3">{fmtDate(b.check_in)}</td>
                        <td className="px-4 py-3">{fmtDate(b.check_out)}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{formatINR(b.total_amount ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">✅ No no-shows in this period</div>
          )}
        </div>
      )}

      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface mb-1">
          Daily Revenue
          <span className="text-xs font-normal text-on-surface-variant ml-2">by check-in date · {dateFrom} → {dateTo}</span>
        </h2>
        {loading ? (
          <div className="h-48 bg-surface rounded-lg animate-pulse mt-4" />
        ) : daily.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">No bookings in selected period</div>
        ) : (
          <div className="relative mt-4">
            <div className="flex">
              <div className="w-20 shrink-0 flex flex-col justify-between text-right pr-3 h-48 text-xs text-on-surface-variant">
                <span>{formatINR(maxRevenue)}</span>
                <span>{formatINR(maxRevenue / 2)}</span>
                <span>₹0</span>
              </div>
              <div className="flex-1 flex items-end gap-0.5 h-48 overflow-x-auto">
                {daily.map((d, i) => {
                  const height = Math.max((Number(d.revenue) / maxRevenue) * 100, 2);
                  return (
                    <div key={i} className="group flex-1 min-w-[6px] flex flex-col items-center justify-end h-full relative">
                      <div className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t-sm cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${d.day}: ${formatINR(d.revenue)} (${d.count} booking${d.count !== 1 ? 's' : ''})`}
                      />
                      <div className="absolute bottom-full mb-1 bg-on-surface text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.day}<br />{formatINR(d.revenue)} · {d.count} booking{d.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex mt-2 pl-20">
              {daily.map((d, i) => (
                <div key={i} className={`flex-1 min-w-[6px] text-center text-[9px] text-on-surface-variant ${i % Math.max(Math.floor(daily.length / 7), 1) === 0 ? '' : 'opacity-0'}`}>
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
            <button onClick={exportRevenueCSV} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download size={11} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['Check-in Date', 'Bookings', 'Revenue', 'Avg Per Booking'].map(h => (
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
                    <td className="px-4 py-3">{d.count}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatINR(d.revenue)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{d.count > 0 ? formatINR(Number(d.revenue) / d.count) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface border-t-2 border-outline-variant">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 font-bold">{daily.reduce((s, d) => s + d.count, 0)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatINR(daily.reduce((s, d) => s + Number(d.revenue), 0))}</td>
                  <td className="px-4 py-3 font-bold">{formatINR(summary?.avgValue ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
