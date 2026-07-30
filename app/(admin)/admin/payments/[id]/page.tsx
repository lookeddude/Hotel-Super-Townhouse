'use client';
/**
 * app/(admin)/admin/payments/[id]/page.tsx
 * Individual payment detail page — full timeline, refund history, gateway response.
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Copy, CheckCircle2 } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatINR } from '@/services/pricingService';
import { PaymentStatusBadge } from '@/components/payment/PaymentStatusBadge';
import { RefundModal } from '@/components/payment/RefundModal';
import { toast } from 'sonner';

export default function AdminPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useSupabase();
  const router = useRouter();

  const [payment, setPayment]     = useState<any>(null);
  const [refunds, setRefunds]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showRefund, setShowRefund] = useState(false);

  async function load() {
    setLoading(true);
    const { data: p } = await (supabase as any)
      .from('payments')
      .select(`
        *, bookings:booking_id (
          booking_reference, check_in, check_out, status, total_amount,
          profiles:guest_id (full_name, email, phone)
        )
      `)
      .eq('id', id)
      .single();
    setPayment(p);

    const { data: r } = await (supabase as any)
      .from('refunds')
      .select('*')
      .eq('payment_id', id)
      .order('created_at', { ascending: false });
    setRefunds(r ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function fmt(d: string | null, time = false) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-xl border border-outline-variant" />
      ))}
    </div>
  );

  if (!payment) return (
    <div className="text-center py-20">
      <p className="text-on-surface-variant">Payment not found</p>
      <button onClick={() => router.push('/admin/payments')} className="mt-4 text-primary hover:underline text-sm">
        ← Back to Payments
      </button>
    </div>
  );

  const booking = payment.bookings;
  const profile = Array.isArray(booking?.profiles) ? booking.profiles[0] : booking?.profiles;
  const refundable = Number(payment.amount) - Number(payment.refund_amount ?? 0);

  const Row = ({ label, value, mono = false }: any) => (
    <div className="flex justify-between py-2.5 border-b border-outline-variant/50 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className={`text-sm font-medium text-on-surface ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/payments')} className="p-2 rounded-lg hover:bg-surface transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-headline-md text-on-surface">Payment Detail</h1>
          <p className="text-sm text-on-surface-variant font-mono">{payment.payment_reference}</p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={payment.status} />
          {payment.status === 'paid' && refundable > 0 && (
            <button onClick={() => setShowRefund(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-error/30 text-error text-sm font-semibold rounded-lg hover:bg-error/5 transition-colors">
              <RotateCcw size={14} /> Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Info */}
        <div className="bg-white rounded-xl border border-outline-variant p-5 space-y-0">
          <h2 className="font-semibold text-on-surface mb-4">Payment Information</h2>
          <Row label="Reference" value={payment.payment_reference} mono />
          <Row label="Amount" value={formatINR(payment.amount)} />
          <Row label="Method" value={payment.method?.replace('_', ' ').toUpperCase()} />
          <Row label="Currency" value={payment.currency} />
          <Row label="Status" value={<PaymentStatusBadge status={payment.status} size="xs" />} />
          <Row label="Paid At" value={fmt(payment.paid_at, true)} />
          <Row label="Created At" value={fmt(payment.created_at, true)} />
          {payment.refund_amount > 0 && (
            <Row label="Refunded" value={formatINR(payment.refund_amount)} />
          )}
          {payment.failure_reason && (
            <Row label="Failure Reason" value={<span className="text-error text-xs">{payment.failure_reason}</span>} />
          )}
        </div>

        {/* Guest & Booking */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-on-surface mb-4">Booking & Guest</h2>
          {booking ? (
            <>
              <div className="space-y-0">
                <Row label="Booking Ref" value={
                  <Link href={`/admin/bookings/${payment.booking_id}`} className="text-primary hover:underline font-mono">
                    {booking.booking_reference}
                  </Link>
                } />
                <Row label="Check-in" value={fmt(booking.check_in)} />
                <Row label="Check-out" value={fmt(booking.check_out)} />
                <Row label="Booking Amount" value={formatINR(booking.total_amount)} />
                <Row label="Booking Status" value={booking.status} />
              </div>
              {profile && (
                <div className="mt-4 pt-4 border-t border-outline-variant">
                  <p className="text-sm font-semibold text-on-surface mb-3">Guest</p>
                  <Row label="Name" value={profile.full_name} />
                  <Row label="Email" value={profile.email} />
                  {profile.phone && <Row label="Phone" value={profile.phone} />}
                </div>
              )}
            </>
          ) : <p className="text-sm text-on-surface-variant">Booking not found</p>}
        </div>
      </div>

      {/* Gateway Details */}
      {payment.gateway_payment_id && (
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-on-surface mb-4">Gateway Details</h2>
          <div className="space-y-0">
            {payment.gateway_order_id && (
              <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/50">
                <span className="text-sm text-on-surface-variant">Order ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-on-surface">{payment.gateway_order_id}</span>
                  <button onClick={() => copyText(payment.gateway_order_id)} className="p-1 hover:text-primary"><Copy size={12} /></button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/50">
              <span className="text-sm text-on-surface-variant">Payment ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-on-surface">{payment.gateway_payment_id}</span>
                <button onClick={() => copyText(payment.gateway_payment_id)} className="p-1 hover:text-primary"><Copy size={12} /></button>
              </div>
            </div>
            {payment.gateway_signature && (
              <Row label="Signature Verified" value={<span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 size={12} /> Verified</span>} />
            )}
          </div>
        </div>
      )}

      {/* Refund History */}
      {refunds.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-on-surface mb-4">Refund History</h2>
          <div className="space-y-3">
            {refunds.map(r => (
              <div key={r.id} className="flex items-start justify-between p-3 bg-surface rounded-lg">
                <div>
                  <p className="text-sm font-semibold">{formatINR(r.amount)}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{r.reason}</p>
                  {r.razorpay_refund_id && <p className="font-mono text-xs text-on-surface-variant mt-1">{r.razorpay_refund_id}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    r.status === 'done' ? 'bg-green-100 text-green-700' :
                    r.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{r.status}</span>
                  <p className="text-xs text-on-surface-variant mt-1">{fmt(r.created_at, true)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRefund && (
        <RefundModal
          paymentId={payment.id}
          bookingRef={booking?.booking_reference ?? ''}
          maxAmount={refundable}
          onClose={() => setShowRefund(false)}
          onSuccess={() => { setShowRefund(false); load(); }}
        />
      )}
    </div>
  );
}
