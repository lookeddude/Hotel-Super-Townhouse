'use client';
/**
 * app/(admin)/admin/reports/page.tsx
 * Finance & Reports — fixed date handling: always passes dates explicitly to avoid stale closures.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { Download, RefreshCw, AlertTriangle, Banknote, Wifi } from 'lucide-react';

interface DailyRow  { day: string; revenue: number; count: number; }
interface Summary   {
  totalRevenue: number; totalBookings: number; avgValue: number;
  confirmedCount: number; checkedInCount: number; checkedOutCount: number; noShowCount: number;
  collectedRevenue: number; onlineRevenue: number; cashRevenue: number; pendingRevenue: number;
}
interface NoShowData { count: number; lostRevenue: number; rate: number; bookings: any[]; }

function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function toCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { supabase } = useSupabase();
  const [dateFrom, setDateFrom] = useState(() => localDate(-30));
  const [dateTo,   setDateTo]   = useState(() => localDate(0));
  const [daily,    setDaily]    = useState<DailyRow[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [noShow,   setNoShow]   = useState<NoShowData | null>(null);
  const [loading,  setLoading]  = useState(false);

  /** Always receives dates explicitly — no stale-closure risk */
  const run = useCallback(async (from: string, to: string) => {
    if (!from || !to || from > to) return;
    setLoading(true);
    const db = supabase as any;

    // All bookings whose check_in falls in [from, to]
    const { data: bks = [] } = await db
      .from('bookings')
      .select('id, booking_reference, check_in, check_out, total_amount, status, payment_status, profiles:guest_id(full_name)')
      .gte('check_in', from)
      .lte('check_in', to)
      .order('check_in', { ascending: true });

    // Split by status
    const cancelled   = (bks as any[]).filter(b => b.status === 'cancelled');
    const noShows     = (bks as any[]).filter(b => b.status === 'no_show');
    const revenue     = (bks as any[]).filter(b => !['cancelled', 'no_show'].includes(b.status));
    const active      = revenue; // pending + confirmed + checked_in + checked_out

    // --- Daily aggregation ---
    const dayMap: Record<string, DailyRow> = {};
    active.forEach(b => {
      const d = b.check_in;
      if (!dayMap[d]) dayMap[d] = { day: d, revenue: 0, count: 0 };
      dayMap[d].revenue += Number(b.total_amount ?? 0);
      dayMap[d].count   += 1;
    });
    const dailyRows = Object.values(dayMap).sort((a,b) => a.day.localeCompare(b.day));
    setDaily(dailyRows);

    // --- Summary ---
    const totalRevenue    = active.reduce((s,b) => s + Number(b.total_amount ?? 0), 0);
    const pendingRevenue  = active.filter(b => b.payment_status !== 'paid').reduce((s,b) => s + Number(b.total_amount ?? 0), 0);

    // Payment method breakdown from payments table
    const { data: pmts = [] } = await db
      .from('payments')
      .select('amount, method, status')
      .eq('status', 'paid')
      .gte('paid_at', from)
      .lte('paid_at', to + 'T23:59:59');

    const onlineRevenue   = (pmts as any[]).filter(p => ['online','upi','card','bank_transfer'].includes(p.method)).reduce((s,p) => s + Number(p.amount), 0);
    const cashRevenue     = (pmts as any[]).filter(p => ['cash','pay_at_hotel'].includes(p.method)).reduce((s,p) => s + Number(p.amount), 0);
    const collectedRevenue = onlineRevenue + cashRevenue;

    setSummary({
      totalRevenue, totalBookings: active.length,
      avgValue: active.length ? totalRevenue / active.length : 0,
      confirmedCount:  active.filter(b => b.status === 'confirmed').length,
      checkedInCount:  active.filter(b => b.status === 'checked_in').length,
      checkedOutCount: active.filter(b => b.status === 'checked_out').length,
      noShowCount:     noShows.length,
      collectedRevenue, onlineRevenue, cashRevenue, pendingRevenue,
    });

    // --- No-show analysis ---
    const nsLost      = noShows.reduce((s,b) => s + Number(b.total_amount ?? 0), 0);
    const totalInRange = (bks as any[]).filter(b => b.status !== 'cancelled').length;
    const rate         = totalInRange ? Math.round((noShows.length / totalInRange) * 100) : 0;
    setNoShow({ count: noShows.length, lostRevenue: nsLost, rate, bookings: noShows });

    setLoading(false);
  }, [supabase]);

  // Initial load on mount
  useEffect(() => { run(localDate(-30), localDate(0)); }, [run]);

  // Quick-range: set state AND fetch immediately with new dates
  const applyRange = (days: number) => {
    const newFrom = localDate(-days);
    const newTo   = localDate(0);
    setDateFrom(newFrom);
    setDateTo(newTo);
    run(newFrom, newTo);   // explicit params — no stale closure
  };

  // Generate button — pass current input values directly
  const generate = () => run(dateFrom, dateTo);

  // CSV exports
  const exportRevCSV = () => {
    const header = ['Check-in Date','Bookings','Revenue (INR)','Avg Per Booking (INR)'];
    const rows   = daily.map(d => [d.day, String(d.count), Number(d.revenue).toFixed(2), d.count > 0 ? (d.revenue/d.count).toFixed(2) : '0']);
    const tot    = daily.reduce((s,d) => s+d.revenue, 0);
    const totCnt = daily.reduce((s,d) => s+d.count, 0);
    rows.push(['TOTAL', String(totCnt), tot.toFixed(2), totCnt > 0 ? (tot/totCnt).toFixed(2) : '0']);
    toCSV([header, ...rows], `revenue_${dateFrom}_to_${dateTo}.csv`);
  };
  const exportNsCSV = () => {
    if (!noShow?.bookings.length) return;
    const header = ['Ref #','Guest','Check-In','Check-Out','Lost Revenue (INR)'];
    const rows   = noShow.bookings.map((b:any) => {
      const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      return [b.booking_reference ?? b.id?.slice(0,8), p?.full_name ?? '—', b.check_in, b.check_out, Number(b.total_amount??0).toFixed(2)];
    });
    rows.push(['','','','TOTAL LOST', noShow.lostRevenue.toFixed(2)]);
    toCSV([header, ...rows], `no_shows_${dateFrom}_to_${dateTo}.csv`);
  };

  const maxRev = Math.max(...daily.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Finance &amp; Reports</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Revenue by check-in date · all booking statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportRevCSV} disabled={!daily.length}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Date Range Picker ── */}
      <div className="bg-white rounded-xl border border-outline-variant p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">From (Check-in)</label>
          <input type="date" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">To (Check-in)</label>
          <input type="date" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        {/* Generate always passes current input values */}
        <button onClick={generate} disabled={loading}
          className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
          {loading ? 'Loading…' : 'Generate'}
        </button>
        {/* Quick ranges — auto-fetch with new dates */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: '7D',  days: 7  },
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
            { label: 'MTD', days: new Date().getDate() - 1 },
            { label: '1Y',  days: 365 },
          ].map(({ label, days }) => (
            <button key={label} onClick={() => applyRange(days)} disabled={loading}
              className="px-3 py-2 text-sm font-medium border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-40 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-outline-variant p-5 sm:col-span-1">
              <p className="text-sm text-on-surface-variant">Total Revenue</p>
              <p className="font-heading font-bold text-3xl text-green-600 mt-1">{formatINR(summary.totalRevenue)}</p>
              <p className="text-xs text-on-surface-variant mt-1">{summary.totalBookings} bookings · avg {formatINR(summary.avgValue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <p className="text-sm text-on-surface-variant">Collected (Payments Received)</p>
              <p className="font-heading font-bold text-2xl text-blue-600 mt-1">{formatINR(summary.collectedRevenue)}</p>
              <div className="flex gap-3 mt-2 text-xs text-on-surface-variant flex-wrap">
                <span className="flex items-center gap-1"><Wifi size={10} className="text-blue-500" /> Online: {formatINR(summary.onlineRevenue)}</span>
                <span className="flex items-center gap-1"><Banknote size={10} className="text-amber-500" /> Cash: {formatINR(summary.cashRevenue)}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <p className="text-sm text-on-surface-variant">Pending Collection</p>
              <p className="font-heading font-bold text-2xl text-amber-600 mt-1">{formatINR(summary.pendingRevenue)}</p>
              <p className="text-xs text-on-surface-variant mt-1">Pay at hotel — not yet collected</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Confirmed',   val: summary.confirmedCount,  cls: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: 'Checked In',  val: summary.checkedInCount,  cls: 'text-green-600',  bg: 'bg-green-50'  },
              { label: 'Checked Out', val: summary.checkedOutCount, cls: 'text-gray-700',   bg: 'bg-gray-50'   },
              { label: 'No Shows',    val: summary.noShowCount,     cls: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl border border-outline-variant p-4`}>
                <p className="text-xs text-on-surface-variant">{k.label}</p>
                <p className={`font-heading font-bold text-2xl mt-1 ${k.cls}`}>{k.val}</p>
              </div>
            ))}
          </div>
        </>
      ) : !loading && (
        <div className="bg-white rounded-xl border border-outline-variant p-10 text-center text-on-surface-variant">
          No bookings found for <strong>{dateFrom}</strong> → <strong>{dateTo}</strong>.
          <br /><span className="text-xs">Try a wider date range.</span>
        </div>
      )}

      {/* ── No Show Analysis ── */}
      {noShow && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" /> No Show Analysis
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">{dateFrom} to {dateTo}</p>
            </div>
            {noShow.bookings.length > 0 && (
              <button onClick={exportNsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100">
                <Download size={12} /> Export CSV
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 p-5 border-b border-orange-100">
            {[
              { val: noShow.count,                     label: 'No Shows',    cls: 'text-orange-600' },
              { val: `${noShow.rate}%`,                label: 'Rate',        cls: 'text-orange-600' },
              { val: formatINR(noShow.lostRevenue),    label: 'Lost Revenue',cls: 'text-red-600'    },
            ].map(k => (
              <div key={k.label} className="text-center">
                <p className={`text-3xl font-bold ${k.cls}`}>{k.val}</p>
                <p className="text-xs text-on-surface-variant mt-1">{k.label}</p>
              </div>
            ))}
          </div>
          {noShow.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr>{['Ref #','Guest','Check-in','Check-out','Lost Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {noShow.bookings.map((b:any) => {
                    const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
                    return (
                      <tr key={b.id} className="hover:bg-surface/40">
                        <td className="px-4 py-3 font-mono text-xs text-primary">#{b.booking_reference ?? b.id?.slice(0,8)}</td>
                        <td className="px-4 py-3 font-medium">{p?.full_name ?? 'Guest'}</td>
                        <td className="px-4 py-3">{fmtDate(b.check_in)}</td>
                        <td className="px-4 py-3">{fmtDate(b.check_out)}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{formatINR(b.total_amount??0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-on-surface-variant">✅ No no-shows in this period</p>
          )}
        </div>
      )}

      {/* ── Daily Bar Chart ── */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface">
          Daily Revenue
          <span className="text-xs font-normal text-on-surface-variant ml-2">{dateFrom} → {dateTo}</span>
        </h2>
        <div className="mt-4">
          {loading ? (
            <div className="h-48 bg-surface rounded animate-pulse" />
          ) : daily.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-on-surface-variant">
              No bookings in selected period — try a different date range
            </div>
          ) : (
            <>
              <div className="flex">
                <div className="w-20 shrink-0 flex flex-col justify-between text-right pr-3 h-48 text-xs text-on-surface-variant">
                  <span>{formatINR(maxRev)}</span>
                  <span>{formatINR(maxRev/2)}</span>
                  <span>₹0</span>
                </div>
                <div className="flex-1 flex items-end gap-0.5 h-48 overflow-x-auto">
                  {daily.map((d,i) => {
                    const h = Math.max((d.revenue/maxRev)*100, 2);
                    return (
                      <div key={i} className="group flex-1 min-w-[6px] flex flex-col items-center justify-end h-full relative">
                        <div className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t-sm"
                          style={{ height: `${h}%` }}
                          title={`${d.day}: ${formatINR(d.revenue)} (${d.count} booking${d.count!==1?'s':''})`} />
                        <div className="absolute bottom-full mb-1 bg-on-surface text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                          {d.day}<br/>{formatINR(d.revenue)} · {d.count} bk
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex mt-1 pl-20">
                {daily.map((d,i) => (
                  <div key={i} className={`flex-1 min-w-[6px] text-center text-[8px] text-on-surface-variant truncate ${i % Math.max(Math.ceil(daily.length/8),1) === 0 ? '' : 'opacity-0'}`}>
                    {new Date(d.day+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Daily Table ── */}
      {daily.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Daily Breakdown</h2>
            <button onClick={exportRevCSV} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download size={11}/> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>{['Check-in Date','Bookings','Revenue','Avg Per Booking'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {[...daily].reverse().map(d=>(
                  <tr key={d.day} className="hover:bg-surface/40">
                    <td className="px-4 py-3 font-medium">{new Date(d.day+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td className="px-4 py-3">{d.count}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatINR(d.revenue)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{d.count>0?formatINR(d.revenue/d.count):'—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface border-t-2 border-outline-variant">
                <tr>
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 font-bold">{daily.reduce((s,d)=>s+d.count,0)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatINR(daily.reduce((s,d)=>s+d.revenue,0))}</td>
                  <td className="px-4 py-3 font-bold">{formatINR(summary?.avgValue??0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
