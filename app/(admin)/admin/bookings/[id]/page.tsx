'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBookingById, confirmBooking, checkInBooking, checkOutBooking, cancelBooking, updateBookingNotes, markNoShow } from '@/services/bookingService';
import { generateInvoice, getInvoiceByBooking } from '@/services/invoiceService';
import { formatINR, formatDate } from '@/services/pricingService';
import { InvoiceView } from '@/components/invoice/InvoiceView';
import { toast } from 'sonner';
import {
  ArrowLeft, BedDouble, Calendar, FileText, LogIn, LogOut,
  CheckCircle, XCircle, Edit2, Save, User, Clock, Phone, Mail, AlertTriangle,
  CreditCard, Banknote, Wifi,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-300',
  confirmed:   'bg-blue-100 text-blue-700 border-blue-300',
  checked_in:  'bg-green-100 text-green-700 border-green-300',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-300',
  cancelled:   'bg-red-100 text-red-700 border-red-300',
  no_show:     'bg-orange-100 text-orange-700 border-orange-300',
};

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { supabase } = useSupabase();

  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectMethod, setCollectMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [collectRef, setCollectRef] = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getBookingById(supabase as any, id);
    setBooking(data);
    setNotes(data?.internal_notes ?? '');
    const { data: inv } = await getInvoiceByBooking(supabase as any, id);
    setInvoice(inv);
    setIsLoading(false);
  }, [supabase, id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action: string, fn: () => Promise<any>) => {
    setActionLoading(action);
    const result = await fn();
    if (result?.error) toast.error(`Action failed: ${result.error.message ?? action}`);
    else { toast.success(`${action} successful`); load(); }
    setActionLoading('');
  };

  const handleConfirm = () => doAction('confirm', () => confirmBooking(supabase as any, id));

  const handleCheckIn = () => {
    const br = Array.isArray(booking?.booking_rooms) ? booking.booking_rooms[0] : booking?.booking_rooms;
    const roomId = br?.room_id;
    if (!roomId) { toast.error('No room assigned to this booking'); return; }
    doAction('check-in', () => checkInBooking(supabase as any, id, roomId));
  };

  const handleCheckOut = () => {
    const br = Array.isArray(booking?.booking_rooms) ? booking.booking_rooms[0] : booking?.booking_rooms;
    const roomId = br?.room_id;
    if (!roomId) { toast.error('No room assigned'); return; }
    doAction('check-out', async () => {
      const res = await checkOutBooking(supabase as any, id, roomId);
      // Auto-generate invoice on checkout
      if (!res.error) await generateInvoice(supabase as any, id);
      return res;
    });
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Reason required'); return; }
    await doAction('cancel', async () => {
      const r = await cancelBooking(supabase as any, id, cancelReason);
      setShowCancelModal(false);
      return r;
    });
  };

  const handleNoShow = () =>
    doAction('no-show', () => markNoShow(supabase as any, id));

  const handleCollectPayment = async () => {
    setActionLoading('collect');
    try {
      const res = await fetch('/api/payments/pay-at-hotel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          method: collectMethod,
          transactionRef: collectRef || undefined,
          notes: `Collected at reception via ${collectMethod}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Payment failed'); }
      else {
        toast.success(`Payment of ${formatINR(data.amount)} collected successfully!`);
        setShowCollectModal(false);
        setCollectRef('');
        load();
      }
    } catch {
      toast.error('Failed to record payment');
    }
    setActionLoading('');
  };

  const handleSaveNotes = async () => {
    const db = supabase as any;
    await db.from('bookings').update({ internal_notes: notes }).eq('id', id);
    setEditNotes(false);
    toast.success('Notes saved');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-lg border border-outline-variant animate-pulse" />)}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-20 text-center">
        <p className="text-on-surface font-semibold">Booking not found</p>
        <Link href="/admin/bookings" className="text-primary text-sm mt-2 block">← Back to Bookings</Link>
      </div>
    );
  }

  if (showInvoice && invoice) return <InvoiceView invoice={invoice} booking={booking} onClose={() => setShowInvoice(false)} />;

  const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
  const br = Array.isArray(booking.booking_rooms) ? booking.booking_rooms[0] : booking.booking_rooms;
  const room = br?.rooms;
  const roomType = br?.room_types;
  const sc = STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600 border-gray-300';

  const canConfirm    = booking.status === 'pending';
  // Payment detection
  const isOnlinePayment   = ['online', 'upi', 'card', 'bank_transfer'].includes(booking.payment_method ?? '');
  const isPayAtHotel      = ['pay_at_hotel', 'cash'].includes(booking.payment_method ?? '') || !booking.payment_method;
  const isPaid            = booking.payment_status === 'paid';
  const needsPayment      = isPayAtHotel && !isPaid;
  // No-show: booking was supposed to check-in in the past but still pending/confirmed
  const todayISO      = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const canMarkNoShow = ['pending', 'confirmed'].includes(booking.status) && booking.check_in < todayISO;
  // Collect payment: only for pay-at-hotel, confirmed, unpaid, non-noshow
  const canCollectPayment = booking.status === 'confirmed' && needsPayment && !canMarkNoShow;
  // Check-in: only if payment done (or online) and not a no-show candidate
  const canCheckIn    = booking.status === 'confirmed' && !canMarkNoShow && (isOnlinePayment || isPaid);
  const canCheckOut   = booking.status === 'checked_in';
  const canCancel     = ['pending', 'confirmed'].includes(booking.status) && !canMarkNoShow;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => router.push('/admin/bookings')} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary mb-2 transition-colors">
            <ArrowLeft size={15} /> All Bookings
          </button>
          <h1 className="font-heading text-headline-md text-on-surface">
            Booking <span className="font-mono text-primary">#{booking.booking_reference}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Created {new Date(booking.created_at).toLocaleString('en-IN')}</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-semibold border ${sc}`}>
          {booking.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </span>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <button onClick={handleConfirm} disabled={actionLoading === 'confirm'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60">
            <CheckCircle size={15} /> {actionLoading === 'confirm' ? 'Confirming…' : 'Confirm Booking'}
          </button>
        )}
        {/* Payment badge for online bookings */}
        {isOnlinePayment && isPaid && (
          <span className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold rounded-lg">
            <Wifi size={14} /> Paid Online
          </span>
        )}
        {/* Collect Payment button for pay-at-hotel */}
        {canCollectPayment && (
          <button
            onClick={() => setShowCollectModal(true)}
            disabled={actionLoading === 'collect'}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60"
          >
            <Banknote size={15} />
            {actionLoading === 'collect' ? 'Recording…' : 'Collect Payment'}
          </button>
        )}
        {canCheckIn && (
          <button onClick={handleCheckIn} disabled={actionLoading === 'check-in'} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60">
            <LogIn size={15} /> {actionLoading === 'check-in' ? 'Checking In…' : 'Check In Guest'}
          </button>
        )}
        {/* Pay-at-hotel pending payment — blocked check-in hint */}
        {booking.status === 'confirmed' && needsPayment && !canMarkNoShow && (
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <Banknote size={12} /> Collect payment first to enable check-in
          </p>
        )}
        {canCheckOut && (
          <button onClick={handleCheckOut} disabled={actionLoading === 'check-out'} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60">
            <LogOut size={15} /> {actionLoading === 'check-out' ? 'Checking Out…' : 'Check Out & Invoice'}
          </button>
        )}
        <button
          onClick={invoice ? () => setShowInvoice(true) : async () => {
            const { data } = await generateInvoice(supabase as any, id);
            if (data?.success) { toast.success('Invoice generated'); load(); setShowInvoice(true); }
            else toast.error('Failed to generate invoice');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-sm font-semibold rounded-lg hover:bg-surface"
        >
          <FileText size={15} /> {invoice ? 'View Invoice' : 'Generate Invoice'}
        </button>
        {canCancel && (
          <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50">
            <XCircle size={15} /> Cancel
          </button>
        )}
        {canMarkNoShow && (
          <button
            onClick={handleNoShow}
            disabled={actionLoading === 'no-show'}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60"
          >
            <AlertTriangle size={15} />
            {actionLoading === 'no-show' ? 'Marking…' : 'Mark No Show'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Guest Info */}
        <div className="bg-white rounded-lg border border-outline-variant p-5">
          <h2 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2"><User size={15} className="text-primary" />Guest Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Name</span><span className="font-medium">{profile?.full_name ?? '—'}</span></div>
            <div className="flex items-center gap-2"><Mail size={12} className="text-on-surface-variant" /><a href={`mailto:${profile?.email}`} className="text-primary hover:underline text-xs">{profile?.email}</a></div>
            {profile?.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-on-surface-variant" /><a href={`tel:${profile?.phone}`} className="text-xs">{profile?.phone}</a></div>}
            <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Adults</span><span>{booking.num_adults}</span></div>
            {booking.num_children > 0 && <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Children</span><span>{booking.num_children}</span></div>}
          </div>
        </div>

        {/* Room Info */}
        <div className="bg-white rounded-lg border border-outline-variant p-5">
          <h2 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2"><BedDouble size={15} className="text-primary" />Room Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Type</span><span className="font-medium">{roomType?.name ?? '—'}</span></div>
            <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Room No.</span><span className="font-mono">{room?.room_number ?? '—'}</span></div>
            {roomType?.bed_type && <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Bed Type</span><span className="capitalize">{roomType.bed_type}</span></div>}
            <div className="flex items-center gap-2"><span className="text-on-surface-variant w-24 flex-shrink-0">Breakfast</span><span className={br?.breakfast_included ? 'text-green-600' : 'text-on-surface-variant'}>{br?.breakfast_included ? 'Included' : 'Not included'}</span></div>
          </div>
        </div>

        {/* Stay Dates */}
        <div className="bg-white rounded-lg border border-outline-variant p-5">
          <h2 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2"><Calendar size={15} className="text-primary" />Stay Dates</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-on-surface-variant">Check-in</p><p className="font-semibold mt-0.5">{formatDate(booking.check_in)}</p></div>
            <div><p className="text-xs text-on-surface-variant">Check-out</p><p className="font-semibold mt-0.5">{formatDate(booking.check_out)}</p></div>
            <div><p className="text-xs text-on-surface-variant">Nights</p><p className="font-semibold mt-0.5">{booking.nights}</p></div>
            <div><p className="text-xs text-on-surface-variant">Source</p><p className="font-semibold mt-0.5 capitalize">{booking.source ?? 'website'}</p></div>
            {booking.arrival_time && <div className="col-span-2"><p className="text-xs text-on-surface-variant">Expected Arrival</p><p className="font-semibold mt-0.5">{booking.arrival_time}</p></div>}
            {booking.special_requests && <div className="col-span-2"><p className="text-xs text-on-surface-variant">Special Requests</p><p className="mt-0.5 text-xs">{booking.special_requests}</p></div>}
          </div>
        </div>

        {/* Price */}
        <div className="bg-white rounded-lg border border-outline-variant p-5">
          <h2 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2"><FileText size={15} className="text-primary" />Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Room ({booking.nights}n × {formatINR(Number(br?.price_per_night ?? 0))})</span><span>{formatINR(Number(br?.total_price ?? 0))}</span></div>
            {Number(booking.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatINR(Number(booking.discount_amount))}</span></div>}
            <div className="flex justify-between"><span className="text-on-surface-variant">Tax (GST)</span><span>{formatINR(Number(booking.tax_amount))}</span></div>
            <div className="flex justify-between font-bold border-t border-outline-variant pt-2 mt-1">
              <span>Total</span><span className="text-primary">{formatINR(Number(booking.total_amount))}</span>
            </div>
            {/* Payment Method */}
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-on-surface-variant">Payment Method</span>
              {isOnlinePayment ? (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  <Wifi size={10} /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <Banknote size={10} /> Pay at Hotel
                </span>
              )}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant">Payment Status</span>
              <span className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                isPaid ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>{booking.payment_status ?? 'pending'}</span>
            </div>
            {Number(booking.balance_amount) > 0 && (
              <div className="flex justify-between text-xs font-semibold text-red-600">
                <span>Balance Due</span><span>{formatINR(Number(booking.balance_amount))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-outline-variant p-5">
        <h2 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2"><Clock size={15} className="text-primary" />Booking Timeline</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><p className="text-xs text-on-surface-variant">Created</p><p>{new Date(booking.created_at).toLocaleString('en-IN')}</p></div>
          {booking.confirmed_at && <div><p className="text-xs text-on-surface-variant">Confirmed</p><p>{new Date(booking.confirmed_at).toLocaleString('en-IN')}</p></div>}
          {booking.checked_in_at && <div className="text-green-700"><p className="text-xs opacity-70">Checked In</p><p>{new Date(booking.checked_in_at).toLocaleString('en-IN')}</p></div>}
          {booking.checked_out_at && <div><p className="text-xs text-on-surface-variant">Checked Out</p><p>{new Date(booking.checked_out_at).toLocaleString('en-IN')}</p></div>}
          {booking.cancelled_at && <div className="text-red-600"><p className="text-xs opacity-70">Cancelled</p><p>{new Date(booking.cancelled_at).toLocaleString('en-IN')}</p></div>}
        </div>
        {booking.cancellation_reason && <p className="text-xs text-red-600 mt-2">Reason: {booking.cancellation_reason}</p>}
      </div>

      {/* Internal Notes */}
      <div className="bg-white rounded-lg border border-outline-variant p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-on-surface">Internal Notes</h2>
          {editNotes
            ? <button onClick={handleSaveNotes} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-white rounded-lg"><Save size={12} /> Save</button>
            : <button onClick={() => setEditNotes(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-outline-variant rounded-lg"><Edit2 size={12} /> Edit</button>}
        </div>
        {editNotes
          ? <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-outline-variant rounded-lg p-3 text-sm focus:outline-none focus:border-primary resize-none" placeholder="Add internal notes visible only to staff…" />
          : <p className="text-sm text-on-surface-variant">{notes || 'No internal notes.'}</p>}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-heading font-semibold text-lg text-on-surface mb-1">Cancel Booking</h3>
            <p className="text-sm text-on-surface-variant mb-4">This action cannot be undone. The room will be released immediately.</p>
            <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason…" className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg text-sm">Confirm Cancel</button>
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">Keep</button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-heading font-semibold text-lg text-on-surface mb-1">Collect Payment</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Total to collect: <span className="font-bold text-primary">{formatINR(Number(booking.balance_amount || booking.total_amount))}</span>
            </p>
            {/* Payment method selector */}
            <p className="text-xs font-semibold text-on-surface-variant mb-2">Payment Method</p>
            <div className="flex gap-2 mb-4">
              {(['cash', 'card', 'upi'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setCollectMethod(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${
                    collectMethod === m
                      ? 'bg-primary text-white border-primary'
                      : 'border-outline-variant hover:bg-surface'
                  }`}
                >
                  {m === 'cash' ? '💵 Cash' : m === 'card' ? '💳 Card' : '📱 UPI'}
                </button>
              ))}
            </div>
            {/* Transaction reference (optional) */}
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Transaction Ref / Receipt No. (optional)</label>
            <input
              type="text"
              value={collectRef}
              onChange={e => setCollectRef(e.target.value)}
              placeholder="e.g. UPI ref, card last 4 digits…"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCollectPayment}
                disabled={actionLoading === 'collect'}
                className="flex-1 py-2.5 bg-amber-500 text-white font-semibold rounded-lg text-sm hover:bg-amber-600 disabled:opacity-60"
              >
                {actionLoading === 'collect' ? 'Recording…' : `Confirm — ${formatINR(Number(booking.balance_amount || booking.total_amount))}`}
              </button>
              <button onClick={() => setShowCollectModal(false)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
