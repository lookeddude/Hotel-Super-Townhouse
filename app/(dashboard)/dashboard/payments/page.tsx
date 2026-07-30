'use client';
/**
 * app/(dashboard)/dashboard/payments/page.tsx
 * Customer payment history — all payments, invoices, download, retry failed.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { formatINR } from '@/services/pricingService';
import { PaymentStatusBadge } from '@/components/payment/PaymentStatusBadge';
import { RazorpayButton } from '@/components/payment/RazorpayButton';
import { FileText, RefreshCw, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  payment_reference: string;
  booking_id: string;
  method: string;
  status: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
  bookings: { booking_reference: string; check_in: string; check_out: string } | null;
  invoices: { id: string; invoice_number: string }[] | null;
}

const METHOD_LABELS: Record<string, string> = {
  online: 'Online (Razorpay)', pay_at_hotel: 'Pay at Hotel',
  cash: 'Cash', upi: 'UPI', card: 'Card', other: 'Other',
};

export default function CustomerPaymentsPage() {
  const { supabase } = useSupabase();
  const { user, isLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);

  async function load() {
    if (!user) return;
    setLoading(true);
    // Get bookings owned by user, then their payments
    const { data, count } = await (supabase as any)
      .from('payments')
      .select(`
        id, payment_reference, booking_id, method, status, amount, paid_at, created_at,
        bookings:booking_id!inner (booking_reference, check_in, check_out, guest_id),
        invoices:booking_id (id, invoice_number)
      `, { count: 'exact' })
      .eq('bookings.guest_id', user.id)
      .order('created_at', { ascending: false });
    setPayments(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }

  useEffect(() => { if (!isLoading) load(); }, [user, isLoading]);

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Payment History</h1>
          <p className="text-body-md text-on-surface-variant mt-1">All your transactions and invoices</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-sm rounded-lg hover:bg-surface transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Total Paid</p>
            <p className="font-heading font-bold text-xl text-green-600 mt-1">{formatINR(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Transactions</p>
            <p className="font-heading font-bold text-xl mt-1">{total}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">Pending</p>
            <p className="font-heading font-bold text-xl text-yellow-600 mt-1">
              {payments.filter(p => p.status === 'pending').length}
            </p>
          </div>
        </div>
      )}

      {/* Payment List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-outline-variant animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant py-20 text-center">
          <CreditCard size={40} className="mx-auto text-outline mb-4" />
          <p className="font-semibold text-on-surface">No payments yet</p>
          <p className="text-sm text-on-surface-variant mt-1">Complete a booking to see your payment history here.</p>
          <Link href="/rooms" className="inline-block mt-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            Browse Rooms
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const booking  = p.bookings as any;
            const invoices = (p.invoices as any[]) ?? [];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-outline-variant p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-on-surface-variant">{p.payment_reference}</span>
                      <PaymentStatusBadge status={p.status} size="xs" />
                    </div>
                    <p className="font-semibold text-on-surface mt-1">{formatINR(p.amount)}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-on-surface-variant">{METHOD_LABELS[p.method] ?? p.method}</span>
                      {p.paid_at && <span className="text-xs text-on-surface-variant">Paid {fmt(p.paid_at)}</span>}
                      {booking?.booking_reference && (
                        <Link href={`/dashboard/bookings/${p.booking_id}`} className="text-xs text-primary hover:underline">
                          Booking {booking.booking_reference}
                        </Link>
                      )}
                    </div>
                    {booking?.check_in && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        {fmt(booking.check_in)} → {fmt(booking.check_out)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Invoice download */}
                    {invoices.length > 0 && (
                      <Link
                        href={`/dashboard/bookings/${p.booking_id}?tab=invoice`}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <FileText size={13} /> Invoice
                      </Link>
                    )}
                    {/* Retry failed payment */}
                    {p.status === 'failed' && (
                      <RazorpayButton
                        bookingId={p.booking_id}
                        amount={p.amount}
                        onSuccess={() => { toast.success('Payment successful!'); load(); }}
                        className="text-xs px-3 py-1.5 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
