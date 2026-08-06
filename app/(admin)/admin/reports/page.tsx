'use client';
/**
 * app/(admin)/admin/reports/page.tsx
 * Finance & Reports + Master Report with full booking details and CSV export.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { Download, RefreshCw, AlertTriangle, Banknote, Wifi, FileSpreadsheet, Search } from 'lucide-react';

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
  const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABEL: Record<string,string> = {
  pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked In',
  checked_out: 'Checked Out', cancelled: 'Cancelled', no_show: 'No Show',
};
const STATUS_COLOR: Record<string,string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-700',
  no_show:     'bg-orange-100 text-orange-700',
};

export default function AdminReportsPage() {
  const { supabase } = useSupabase();
  const [dateFrom, setDateFrom] = useState(() => localDate(-30));
  const [dateTo,   setDateTo]   = useState(() => localDate(0));
  const [daily,    setDaily]    = useState<DailyRow[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [noShow,   setNoShow]   = useState<NoShowData | null>(null);
  const [master,   setMaster]   = useState<any[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(false);

  const run = useCallback(async (from: string, to: string) => {
    if (!from || !to || from > to) return;
    setLoading(true);
    const db = supabase as any;

    // ── Master Report: full booking details ───────────────────────────────
    const { data: masterRaw = [] } = await db
      .from('bookings')
      .select(`
        id, booking_reference, status, check_in, check_out, nights,
        arrival_time, total_amount, payment_status, created_at,
        num_adults, num_children, special_requests,
        profiles:guest_id(full_name, email, phone),
        booking_rooms(
          price_per_night,
          rooms:room_id(room_number),
          room_types:room_type_id(name)
        ),
        payments(method, amount, paid_at)
      `)
      .gte('check_in', from)
      .lte('check_in', to)
      .order('check_in', { ascending: false });
    setMaster(masterRaw as any[]);

    // ── Daily + summary (exclude cancelled) ───────────────────────────────
    const bks = masterRaw as any[];
    const active   = bks.filter(b => !['cancelled'].includes(b.status));
    const noShows  = bks.filter(b => b.status === 'no_show');
    const revenue  = bks.filter(b => !['cancelled','no_show'].includes(b.status));

    const dayMap: Record<string,DailyRow> = {};
    revenue.forEach(b => {
      const d = b.check_in;
      if (!dayMap[d]) dayMap[d] = { day: d, revenue: 0, count: 0 };
      dayMap[d].revenue += Number(b.total_amount ?? 0);
      dayMap[d].count   += 1;
    });
    setDaily(Object.values(dayMap).sort((a,b) => a.day.localeCompare(b.day)));

    const totalRevenue   = revenue.reduce((s,b) => s + Number(b.total_amount??0), 0);
    const pendingRevenue = active.filter(b => b.payment_status !== 'paid').reduce((s,b) => s + Number(b.total_amount??0), 0);

    const { data: pmts = [] } = await db
      .from('payments').select('amount, method, status')
      .eq('status','paid').gte('paid_at', from).lte('paid_at', to + 'T23:59:59');
    const onlineRevenue = (pmts as any[]).filter(p => ['online','upi','card','bank_transfer'].includes(p.method)).reduce((s,p) => s + Number(p.amount),0);
    const cashRevenue   = (pmts as any[]).filter(p => ['cash','pay_at_hotel'].includes(p.method)).reduce((s,p) => s + Number(p.amount),0);

    setSummary({
      totalRevenue, totalBookings: active.length,
      avgValue: active.length ? totalRevenue / active.length : 0,
      confirmedCount:  active.filter(b => b.status==='confirmed').length,
      checkedInCount:  active.filter(b => b.status==='checked_in').length,
      checkedOutCount: active.filter(b => b.status==='checked_out').length,
      noShowCount: noShows.length,
      collectedRevenue: onlineRevenue + cashRevenue,
      onlineRevenue, cashRevenue, pendingRevenue,
    });

    const nsLost = noShows.reduce((s,b) => s + Number(b.total_amount??0), 0);
    const totalInRange = bks.filter(b => b.status !== 'cancelled').length;
    const rate = totalInRange ? Math.round((noShows.length / totalInRange) * 100) : 0;

    const { data: noShowDetails = [] } = await db
      .from('bookings')
      .select('id, booking_reference, check_in, check_out, total_amount, profiles:guest_id(full_name)')
      .eq('status','no_show').gte('check_in', from).lte('check_in', to);
    setNoShow({ count: noShows.length, lostRevenue: nsLost, rate, bookings: noShowDetails as any[] });

    setLoading(false);
  }, [supabase]);

  useEffect(() => { run(localDate(-30), localDate(0)); }, [run]);

  const applyRange = (days: number) => {
    const f = localDate(-days), t = localDate(0);
    setDateFrom(f); setDateTo(t); run(f, t);
  };
  const generate = () => run(dateFrom, dateTo);

  // ── Master report helpers ─────────────────────────────────────────────
  const getRow = (b: any) => {
    const profile  = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
    const br       = Array.isArray(b.booking_rooms) ? b.booking_rooms[0] : b.booking_rooms;
    const room     = Array.isArray(br?.rooms) ? br?.rooms[0] : br?.rooms;
    const roomType = Array.isArray(br?.room_types) ? br?.room_types[0] : br?.room_types;
    const pay      = Array.isArray(b.payments) ? b.payments[0] : b.payments;
    const payMode  = pay?.method ?? 'pay_at_hotel';
    const payLabel = ['online','upi','card','bank_transfer'].includes(payMode) ? 'Online' : 'Pay at Hotel';
    return { profile, br, room, roomType, pay, payMode, payLabel };
  };

  const filteredMaster = master.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const { profile, room, roomType } = getRow(b);
    return (
      b.booking_reference?.toLowerCase().includes(q) ||
      profile?.full_name?.toLowerCase().includes(q) ||
      profile?.email?.toLowerCase().includes(q) ||
      profile?.phone?.toLowerCase().includes(q) ||
      room?.room_number?.toString().includes(q) ||
      roomType?.name?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  // ── Master CSV export ─────────────────────────────────────────────────
  const exportMasterCSV = () => {
    const header = [
      'Booking Ref', 'Booking Date', 'Guest Name', 'Email', 'Phone',
      'Room Number', 'Room Type', 'Check-In', 'Check-Out', 'Nights',
      'Adults', 'Children', 'Arrival Time', 'Payment Mode', 'Payment Status',
      'Total Amount (INR)', 'Status', 'Special Requests',
    ];
    const rows = master.map(b => {
      const { profile, room, roomType, payLabel } = getRow(b);
      return [
        b.booking_reference ?? b.id?.slice(0,8),
        b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '',
        profile?.full_name ?? '',
        profile?.email ?? '',
        profile?.phone ?? '',
        room?.room_number ?? '',
        roomType?.name ?? '',
        b.check_in ?? '',
        b.check_out ?? '',
        String(b.nights ?? ''),
        String(b.num_adults ?? ''),
        String(b.num_children ?? ''),
        b.arrival_time ?? '',
        payLabel,
        b.payment_status ?? '',
        Number(b.total_amount ?? 0).toFixed(2),
        STATUS_LABEL[b.status] ?? b.status ?? '',
        b.special_requests ?? '',
      ];
    });
    toCSV([header, ...rows], `master_report_${dateFrom}_to_${dateTo}.csv`);
  };

  // Revenue CSV
  const exportRevCSV = () => {
    const header = ['Check-in Date','Bookings','Revenue (INR)','Avg Per Booking (INR)'];
    const rows   = daily.map(d => [d.day, String(d.count), d.revenue.toFixed(2), d.count>0?(d.revenue/d.count).toFixed(2):'0']);
    const tot = daily.reduce((s,d)=>s+d.revenue,0), totCnt = daily.reduce((s,d)=>s+d.count,0);
    rows.push(['TOTAL', String(totCnt), tot.toFixed(2), totCnt>0?(tot/totCnt).toFixed(2):'0']);
    toCSV([header,...rows], `revenue_${dateFrom}_to_${dateTo}.csv`);
  };
  const exportNsCSV = () => {
    if (!noShow?.bookings.length) return;
    const header = ['Ref #','Guest','Check-In','Check-Out','Lost Revenue (INR)'];
    const rows   = noShow.bookings.map((b:any) => {
      const p = Array.isArray(b.profiles)?b.profiles[0]:b.profiles;
      return [b.booking_reference??b.id?.slice(0,8), p?.full_name??'—', b.check_in, b.check_out, Number(b.total_amount??0).toFixed(2)];
    });
    rows.push(['','','','TOTAL LOST', noShow.lostRevenue.toFixed(2)]);
    toCSV([header,...rows], `no_shows_${dateFrom}_to_${dateTo}.csv`);
  };

  const maxRev = Math.max(...daily.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Finance &amp; Reports</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Revenue analytics and master booking report</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportRevCSV} disabled={!daily.length}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40">
            <Download size={14} /> Revenue CSV
          </button>
          <button onClick={exportMasterCSV} disabled={!master.length}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40">
            <FileSpreadsheet size={14} /> Master CSV
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
        <button onClick={generate} disabled={loading}
          className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
          {loading ? 'Loading…' : 'Generate'}
        </button>
        <div className="flex gap-1.5 flex-wrap">
          {[{label:'7D',days:7},{label:'30D',days:30},{label:'90D',days:90},{label:'MTD',days:new Date().getDate()-1},{label:'1Y',days:365}].map(({label,days})=>(
            <button key={label} onClick={()=>applyRange(days)} disabled={loading}
              className="px-3 py-2 text-sm font-medium border border-outline-variant rounded-lg hover:bg-surface disabled:opacity-40 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <p className="text-sm text-on-surface-variant">Total Revenue</p>
              <p className="font-heading font-bold text-3xl text-green-600 mt-1">{formatINR(summary.totalRevenue)}</p>
              <p className="text-xs text-on-surface-variant mt-1">{summary.totalBookings} bookings · avg {formatINR(summary.avgValue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <p className="text-sm text-on-surface-variant">Collected (Paid)</p>
              <p className="font-heading font-bold text-2xl text-blue-600 mt-1">{formatINR(summary.collectedRevenue)}</p>
              <div className="flex gap-3 mt-2 text-xs text-on-surface-variant flex-wrap">
                <span className="flex items-center gap-1"><Wifi size={10} className="text-blue-500"/>Online: {formatINR(summary.onlineRevenue)}</span>
                <span className="flex items-center gap-1"><Banknote size={10} className="text-amber-500"/>Cash: {formatINR(summary.cashRevenue)}</span>
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
              {label:'Confirmed',  val:summary.confirmedCount,  cls:'text-blue-600',   bg:'bg-blue-50'},
              {label:'Checked In', val:summary.checkedInCount,  cls:'text-green-600',  bg:'bg-green-50'},
              {label:'Checked Out',val:summary.checkedOutCount, cls:'text-gray-700',   bg:'bg-gray-50'},
              {label:'No Shows',   val:summary.noShowCount,     cls:'text-orange-600', bg:'bg-orange-50'},
            ].map(k=>(
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
        </div>
      )}

      {/* No Show */}
      {noShow && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500"/> No Show Analysis
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">{dateFrom} to {dateTo}</p>
            </div>
            {noShow.bookings.length > 0 && (
              <button onClick={exportNsCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100">
                <Download size={12}/> Export CSV
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 p-5">
            {[{val:noShow.count,label:'No Shows',cls:'text-orange-600'},{val:`${noShow.rate}%`,label:'Rate',cls:'text-orange-600'},{val:formatINR(noShow.lostRevenue),label:'Lost Revenue',cls:'text-red-600'}].map(k=>(
              <div key={k.label} className="text-center">
                <p className={`text-3xl font-bold ${k.cls}`}>{k.val}</p>
                <p className="text-xs text-on-surface-variant mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Chart */}
      <div className="bg-white rounded-xl border border-outline-variant p-5">
        <h2 className="font-semibold text-on-surface">Daily Revenue
          <span className="text-xs font-normal text-on-surface-variant ml-2">{dateFrom} → {dateTo}</span>
        </h2>
        <div className="mt-4">
          {loading ? <div className="h-48 bg-surface rounded animate-pulse"/> :
           daily.length === 0 ? <div className="h-48 flex items-center justify-center text-sm text-on-surface-variant">No data in selected period</div> : (
            <>
              <div className="flex">
                <div className="w-20 shrink-0 flex flex-col justify-between text-right pr-3 h-48 text-xs text-on-surface-variant">
                  <span>{formatINR(maxRev)}</span><span>{formatINR(maxRev/2)}</span><span>₹0</span>
                </div>
                <div className="flex-1 flex items-end gap-0.5 h-48 overflow-x-auto">
                  {daily.map((d,i)=>{
                    const h=Math.max((d.revenue/maxRev)*100,2);
                    return(
                      <div key={i} className="group flex-1 min-w-[6px] flex flex-col items-center justify-end h-full relative">
                        <div className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t-sm" style={{height:`${h}%`}} title={`${d.day}: ${formatINR(d.revenue)}`}/>
                        <div className="absolute bottom-full mb-1 bg-on-surface text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                          {d.day}<br/>{formatINR(d.revenue)} · {d.count} bk
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex mt-1 pl-20">
                {daily.map((d,i)=>(
                  <div key={i} className={`flex-1 min-w-[6px] text-center text-[8px] text-on-surface-variant ${i%Math.max(Math.ceil(daily.length/8),1)===0?'':'opacity-0'}`}>
                    {new Date(d.day+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MASTER REPORT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-outline-variant bg-gradient-to-r from-green-50 to-blue-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-green-600"/>
            <div>
              <h2 className="font-semibold text-on-surface">Master Report</h2>
              <p className="text-xs text-on-surface-variant">{master.length} total bookings · {dateFrom} to {dateTo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search within master */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name, email, room…"
                className="pl-8 pr-3 py-1.5 border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"/>
            </div>
            <button onClick={exportMasterCSV} disabled={!master.length}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40">
              <Download size={13}/> Download Full CSV ({master.length} rows)
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-surface rounded animate-pulse"/>)}</div>
        ) : filteredMaster.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">
            {master.length === 0 ? 'No bookings in this date range' : 'No results matching your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-surface sticky top-0 z-10">
                <tr>
                  {['Ref #','Booking Date','Guest','Email','Phone','Room','Check-In','Check-Out','Nights','Adults','Arrival Time','Payment Mode','Pymt Status','Amount','Status'].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide whitespace-nowrap border-b border-outline-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredMaster.map((b:any)=>{
                  const {profile,room,roomType,payLabel} = getRow(b);
                  const isNoShow = b.status === 'no_show';
                  return(
                    <tr key={b.id} className={`hover:bg-surface/40 transition-colors ${isNoShow?'bg-orange-50/40':''}`}>
                      <td className="px-3 py-2.5 font-mono text-xs text-primary whitespace-nowrap">
                        {b.booking_reference ?? b.id?.slice(0,8)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{profile?.full_name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant">{profile?.email ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{profile?.phone ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-semibold">#{room?.room_number ?? '—'}</span>
                        {roomType?.name && <span className="text-xs text-on-surface-variant ml-1">· {roomType.name}</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs">{b.check_in ? fmtDate(b.check_in) : '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs">{b.check_out ? fmtDate(b.check_out) : '—'}</td>
                      <td className="px-3 py-2.5 text-center">{b.nights ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">{b.num_adults ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{b.arrival_time ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payLabel==='Online'?'bg-blue-50 text-blue-700':'bg-amber-50 text-amber-700'}`}>
                          {payLabel==='Online'?'🌐 Online':'💵 At Hotel'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.payment_status==='paid'?'bg-green-50 text-green-700':'bg-yellow-50 text-yellow-700'}`}>
                          {b.payment_status ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-green-700 whitespace-nowrap">{formatINR(b.total_amount??0)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[b.status]??'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[b.status]??b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot className="bg-surface border-t-2 border-outline-variant">
                <tr>
                  <td colSpan={13} className="px-3 py-3 font-bold text-sm">
                    Total ({filteredMaster.length} bookings)
                  </td>
                  <td className="px-3 py-3 font-bold text-green-700 whitespace-nowrap">
                    {formatINR(filteredMaster.reduce((s,b)=>s+Number(b.total_amount??0),0))}
                  </td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
