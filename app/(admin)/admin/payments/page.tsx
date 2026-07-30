'use client';
/**
 * app/(admin)/admin/payments/page.tsx
 * Financial Dashboard — live revenue KPIs, transaction table, refund modal.
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  TrendingUp, Clock, XCircle, RotateCcw, CreditCard, Banknote,
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, IndianRupee
} from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { PaymentStatusBadge } from '@/components/payment/PaymentStatusBadge';
import { RefundModal } from '@/components/payment/RefundModal';

interface Payment {
  id: string;
  payment_reference: string;
  booking_id: string;
  method: string;
  status: string;
  amount: number;
  refund_amount: number;
  gateway_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  failure_reason: string | null;
  bookings: { booking_reference: string; check_in: string; check_out: string } | null;
  profiles: { full_name: string; email: string } | null;
}

interface Stats {
  today_revenue: number;
  mtd_revenue: number;
  pending_count: number;
  pending_amount: number;
  failed_count: number;
  total_refunded: number;
  online_revenue: number;
  cash_revenue: number;
}

const PAGE_SIZE = 25;
const METHOD_LABELS: Record<string, string> = {
  online: 'Online', pay_at_hotel: 'Pay at Hotel', cash: 'Cash',
  upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer', other: 'Other',
};

export default function AdminPaymentsPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [payments, setPayments]     = useState<Payment[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(0);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [methodFilter, setMethod]   = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const fetchStats = useCallback(async () => {
    const { data } = await (supabase as any).rpc('get_payment_stats');
    if (data) setStats(data);
  }, [supabase]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any)
      .from('payments')
      .select(`
        id, payment_reference, booking_id, method, status, amount, refund_amount,
        gateway_payment_id, paid_at, created_at, failure_reason,
        bookings:booking_id (booking_reference, check_in, check_out),
        profiles:bookings(guest_id(full_name, email))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter) q = q.eq('status', statusFilter);
    if (methodFilter) q = q.eq('method', methodFilter);
    if (dateFrom)     q = q.gte('created_at', dateFrom);
    if (dateTo)       q = q.lte('created_at', dateTo + 'T23:59:59');

    const { data, count } = await q;
    setPayments(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, page, statusFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filtered = search
    ? payments.filter(p =>
        p.payment_reference?.toLowerCase().includes(search.toLowerCase()) ||
        (p.bookings as any)?.booking_reference?.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const KPI = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-white rounded-xl border border-outline-variant p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">{label}</p>
          <p className={`font-heading font-bold text-2xl mt-1 ${color || 'text-on-surface'}`}>{value}</p>
          {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 bg-surface rounded-lg"><Icon size={20} className="text-primary" /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Payments</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Financial overview & transaction management</p>
        </div>
        <button onClick={() => { fetchStats(); fetchPayments(); }}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-sm font-medium rounded-lg hover:bg-surface transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}   label="Today's Revenue"  value={stats ? formatINR(stats.today_revenue) : '—'} color="text-green-600" />
        <KPI icon={IndianRupee}  label="MTD Revenue"      value={stats ? formatINR(stats.mtd_revenue) : '—'} />
        <KPI icon={Clock}        label="Pending Payments" value={stats ? stats.pending_count : '—'} sub={stats ? `${formatINR(stats.pending_amount)} outstanding` : ''} color="text-yellow-600" />
        <KPI icon={RotateCcw}    label="Total Refunded"   value={stats ? formatINR(stats.total_refunded) : '—'} color="text-purple-600" />
      </div>

      {/* Method Breakdown */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Online (Razorpay)', value: stats.online_revenue, icon: CreditCard },
            { label: 'Cash / Walk-in',    value: stats.cash_revenue,   icon: Banknote },
            { label: 'Failed Payments',  value: stats.failed_count,   icon: XCircle, isCount: true },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-outline-variant p-4 flex items-center gap-3">
              <m.icon size={18} className="text-on-surface-variant shrink-0" />
              <div>
                <p className="text-xs text-on-surface-variant">{m.label}</p>
                <p className="font-semibold text-on-surface text-sm">{m.isCount ? m.value : formatINR(m.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-outline-variant p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by reference…"
            className="w-full pl-8 pr-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm bg-white focus:outline-none">
          <option value="">All Statuses</option>
          {['pending','authorized','paid','failed','cancelled','refunded','partially_refunded'].map(s =>
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_',' ')}</option>
          )}
        </select>
        <select value={methodFilter} onChange={e => { setMethod(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm bg-white focus:outline-none">
          <option value="">All Methods</option>
          {Object.entries(METHOD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none" />
        {(statusFilter || methodFilter || dateFrom || dateTo) && (
          <button onClick={() => { setStatus(''); setMethod(''); setDateFrom(''); setDateTo(''); setPage(0); }}
            className="px-3 py-2 text-sm text-error border border-error/30 rounded-lg hover:bg-error/5 transition-colors flex items-center gap-1">
            <Filter size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                {['Reference','Booking','Method','Amount','Status','Date','Actions'].map(h => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-surface rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-on-surface-variant">No payments found</td></tr>
              ) : filtered.map(p => {
                const booking = p.bookings as any;
                const refundable = Number(p.amount) - Number(p.refund_amount ?? 0);
                return (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{p.payment_reference}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${p.booking_id}`} className="text-primary hover:underline text-xs font-medium">
                        {booking?.booking_reference ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className="capitalize">{METHOD_LABELS[p.method] ?? p.method}</span></td>
                    <td className="px-4 py-3 font-semibold">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{fmt(p.paid_at ?? p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/payments/${p.id}`}
                          className="p-1.5 rounded hover:bg-surface text-on-surface-variant hover:text-primary transition-colors">
                          <Eye size={14} />
                        </Link>
                        {p.status === 'paid' && refundable > 0 && (
                          <button onClick={() => setRefundTarget(p)}
                            className="p-1.5 rounded hover:bg-surface text-on-surface-variant hover:text-error transition-colors">
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm px-2">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <RefundModal
          paymentId={refundTarget.id}
          bookingRef={(refundTarget.bookings as any)?.booking_reference ?? ''}
          maxAmount={Number(refundTarget.amount) - Number(refundTarget.refund_amount ?? 0)}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => { setRefundTarget(null); fetchPayments(); fetchStats(); toast.success('Refund initiated'); }}
        />
      )}
    </div>
  );
}
