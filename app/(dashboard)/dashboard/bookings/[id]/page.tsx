'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getBookingById, cancelBooking } from '@/services/bookingService';
import { generateInvoice, getInvoiceByBooking } from '@/services/invoiceService';
import { formatINR, formatDate } from '@/services/pricingService';
import { InvoiceView } from '@/components/invoice/InvoiceView';
import { toast } from 'sonner';
import {
  Calendar, BedDouble, Users, Clock, FileText, XCircle,
  ArrowLeft, CheckCircle2, MapPin, Phone, Star,
} from 'lucide-react';
// Star rating picker
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star size={24} className={s <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending Confirmation', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed:   { label: 'Confirmed',            color: 'bg-blue-100 text-blue-700 border-blue-200' },
  checked_in:  { label: 'Currently Checked In', color: 'bg-green-100 text-green-700 border-green-200' },
  checked_out: { label: 'Stay Completed',        color: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled:   { label: 'Cancelled',             color: 'bg-red-100 text-red-700 border-red-200' },
  no_show:     { label: 'No Show',               color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  // Review state
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    overall_rating: 0, cleanliness_rating: 0, service_rating: 0,
    value_rating: 0, comfort_rating: 0,
    title: '', comment: '',
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getBookingById(supabase as any, id);
    setBooking(data);
    if (data) {
      const { data: inv } = await getInvoiceByBooking(supabase as any, id);
      setInvoice(inv);
      // Check if review already submitted for this booking
      const { data: rev } = await (supabase as any)
        .from('reviews').select('id, overall_rating, comment').eq('booking_id', id).maybeSingle();
      setExistingReview(rev ?? null);
    }
    setIsLoading(false);
  }, [supabase, id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a cancellation reason'); return; }
    setIsCancelling(true);
    const { error } = await cancelBooking(supabase as any, id, cancelReason);
    if (error) { toast.error('Failed to cancel booking'); setIsCancelling(false); return; }
    toast.success('Booking cancelled successfully');
    setShowCancelModal(false);
    load();
    setIsCancelling(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.overall_rating) { toast.error('Please give an overall rating'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment'); return; }
    setIsSubmittingReview(true);
    const room = Array.isArray(booking?.booking_rooms) ? booking.booking_rooms[0] : null;
    const { error } = await (supabase as any).from('reviews').insert({
      booking_id:         id,
      guest_id:           user?.id,
      room_id:            room?.room_id ?? null,
      room_type_id:       room?.room_type_id ?? null,
      overall_rating:     reviewForm.overall_rating,
      cleanliness_rating: reviewForm.cleanliness_rating || null,
      service_rating:     reviewForm.service_rating || null,
      value_rating:       reviewForm.value_rating || null,
      comfort_rating:     reviewForm.comfort_rating || null,
      title:              reviewForm.title || null,
      comment:            reviewForm.comment,
      is_verified_guest:  true,
      status:             'pending',
    });
    setIsSubmittingReview(false);
    if (error) { toast.error('Failed to submit review. Please try again.'); return; }
    toast.success('Thank you for your review! 🌟');
    setReviewSubmitted(true);
    setExistingReview({ overall_rating: reviewForm.overall_rating, comment: reviewForm.comment });

    // 🔔 Notify admin that a new review is pending moderation
    fetch('/api/notifications/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:  'review_request',
        title: `⭐ New Review — ${reviewForm.overall_rating}/5 Stars`,
        body:  `${reviewForm.title ? `"${reviewForm.title}" — ` : ''}${reviewForm.comment.slice(0, 100)}${reviewForm.comment.length > 100 ? '…' : ''}`,
        data:  { action_url: '/admin/reviews', booking_id: id },
      }),
    }).catch(() => {});
  };
  const handleGenerateInvoice = async () => {
    const { data, error } = await generateInvoice(supabase as any, id);
    if (error || !data?.success) { toast.error('Failed to generate invoice'); return; }
    toast.success('Invoice generated');
    const { data: inv } = await getInvoiceByBooking(supabase as any, id);
    setInvoice(inv);
    setShowInvoice(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-outline-variant animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-on-surface">Booking not found</p>
          <Link href="/dashboard/bookings" className="text-primary text-sm mt-2 block">← Back to My Bookings</Link>
        </div>
      </div>
    );
  }

  const room = Array.isArray(booking.booking_rooms) ? booking.booking_rooms[0] : null;
  const roomType = room?.room_types;
  const roomInfo = room?.rooms;
  const sc = STATUS_CONFIG[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canGetInvoice = ['checked_out', 'confirmed', 'checked_in'].includes(booking.status);

  if (showInvoice && invoice) {
    return <InvoiceView invoice={invoice} booking={booking} onClose={() => setShowInvoice(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-outline-variant px-6 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-2">
          <ArrowLeft size={16} /> My Bookings
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-headline-md text-on-surface">Booking #{booking.booking_reference}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Made on {formatDate(booking.created_at?.split('T')[0])}</p>
          </div>
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium border ${sc.color}`}>{sc.label}</span>
        </div>
      </div>

      <div className="container-custom py-6 max-w-2xl space-y-4">
        {/* Room Details */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-base text-on-surface mb-3 flex items-center gap-2"><BedDouble size={16} className="text-primary" />Room Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Room Type</span><span className="font-medium">{roomType?.name ?? '—'}</span></div>
            {roomInfo?.room_number && <div className="flex justify-between"><span className="text-on-surface-variant">Room Number</span><span className="font-medium">{roomInfo.room_number}</span></div>}
            {roomType?.bed_type && <div className="flex justify-between"><span className="text-on-surface-variant">Bed Type</span><span className="font-medium capitalize">{roomType.bed_type}</span></div>}
            {room?.breakfast_included && <div className="flex justify-between"><span className="text-on-surface-variant">Breakfast</span><span className="font-medium text-green-600">Included</span></div>}
          </div>
        </div>

        {/* Stay Dates */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-base text-on-surface mb-3 flex items-center gap-2"><Calendar size={16} className="text-primary" />Stay Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-on-surface-variant text-xs mb-1">Check-in</p><p className="font-semibold">{formatDate(booking.check_in)}</p></div>
            <div><p className="text-on-surface-variant text-xs mb-1">Check-out</p><p className="font-semibold">{formatDate(booking.check_out)}</p></div>
            <div><p className="text-on-surface-variant text-xs mb-1">Duration</p><p className="font-semibold">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</p></div>
            <div><p className="text-on-surface-variant text-xs mb-1">Guests</p><p className="font-semibold">{booking.num_adults} Adult{booking.num_adults !== 1 ? 's' : ''}{booking.num_children > 0 ? `, ${booking.num_children} Child` : ''}</p></div>
            {booking.arrival_time && <div><p className="text-on-surface-variant text-xs mb-1">Expected Arrival</p><p className="font-semibold">{booking.arrival_time}</p></div>}
            {booking.special_requests && <div className="col-span-2"><p className="text-on-surface-variant text-xs mb-1">Special Requests</p><p className="text-sm">{booking.special_requests}</p></div>}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <h2 className="font-semibold text-base text-on-surface mb-3 flex items-center gap-2"><FileText size={16} className="text-primary" />Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Room ({booking.nights} nights × {formatINR(Number(room?.price_per_night ?? 0))})</span><span>{formatINR(Number(room?.total_price ?? 0))}</span></div>
            {room?.breakfast_included && booking.subtotal > Number(room?.total_price) && (
              <div className="flex justify-between"><span className="text-on-surface-variant">Breakfast Package</span><span>{formatINR(Number(booking.subtotal) - Number(room.total_price))}</span></div>
            )}
            {Number(booking.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatINR(Number(booking.discount_amount))}</span></div>
            )}
            <div className="flex justify-between"><span className="text-on-surface-variant">Taxes & Fees</span><span>{formatINR(Number(booking.tax_amount))}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-outline-variant mt-2">
              <span>Total Amount</span><span className="text-primary">{formatINR(Number(booking.total_amount))}</span>
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Balance Due</span><span>{formatINR(Number(booking.balance_amount))}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {(booking.confirmed_at || booking.checked_in_at || booking.checked_out_at || booking.cancelled_at) && (
          <div className="bg-white rounded-xl border border-outline-variant p-5">
            <h2 className="font-semibold text-base text-on-surface mb-3 flex items-center gap-2"><Clock size={16} className="text-primary" />Timeline</h2>
            <div className="space-y-2 text-sm">
              {booking.confirmed_at && <div className="flex justify-between"><span className="text-on-surface-variant">Confirmed</span><span>{new Date(booking.confirmed_at).toLocaleString('en-IN')}</span></div>}
              {booking.checked_in_at && <div className="flex justify-between text-green-700"><span>Checked In</span><span>{new Date(booking.checked_in_at).toLocaleString('en-IN')}</span></div>}
              {booking.checked_out_at && <div className="flex justify-between"><span className="text-on-surface-variant">Checked Out</span><span>{new Date(booking.checked_out_at).toLocaleString('en-IN')}</span></div>}
              {booking.cancelled_at && <div className="flex justify-between text-red-600"><span>Cancelled</span><span>{new Date(booking.cancelled_at).toLocaleString('en-IN')}</span></div>}
              {booking.cancellation_reason && <div className="text-xs text-on-surface-variant mt-1">Reason: {booking.cancellation_reason}</div>}
            </div>
          </div>
        )}

        {/* Post-Checkout Review Section */}
        {booking.status === 'checked_out' && (
          <div className="bg-white rounded-xl border border-outline-variant p-5">
            <h2 className="font-semibold text-base text-on-surface mb-1 flex items-center gap-2">
              <Star size={16} className="text-yellow-400" /> Share Your Experience
            </h2>
            {existingReview ? (
              <div className="text-center py-4">
                <div className="flex justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={20} className={s <= existingReview.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="text-sm font-medium text-green-600">✅ You've already reviewed this stay</p>
                <p className="text-xs text-on-surface-variant mt-1 italic">"{existingReview.comment?.slice(0, 80)}..."</p>
              </div>
            ) : reviewSubmitted ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">🌟</p>
                <p className="font-semibold text-on-surface">Thank you for your review!</p>
                <p className="text-sm text-on-surface-variant mt-1">Your review is pending approval and will appear shortly.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-3">
                {/* Overall Rating */}
                <div>
                  <p className="text-sm font-medium text-on-surface mb-1.5">Overall Rating <span className="text-red-500">*</span></p>
                  <StarPicker value={reviewForm.overall_rating} onChange={v => setReviewForm(f => ({ ...f, overall_rating: v }))} />
                </div>
                {/* Sub-ratings */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'cleanliness_rating', label: 'Cleanliness' },
                    { key: 'service_rating',     label: 'Service' },
                    { key: 'value_rating',        label: 'Value for Money' },
                    { key: 'comfort_rating',      label: 'Comfort' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, [key]: s }))}
                            className="transition-transform hover:scale-110">
                            <Star size={14} className={(reviewForm as any)[key] >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-on-surface block mb-1">Review Title</label>
                  <input type="text" placeholder="Summarise your experience..."
                    value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                {/* Comment */}
                <div>
                  <label className="text-sm font-medium text-on-surface block mb-1">Your Review <span className="text-red-500">*</span></label>
                  <textarea rows={4} placeholder="Tell us about your stay — what did you love? Any suggestions?"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
                  />
                </div>
                <button onClick={handleSubmitReview} disabled={isSubmittingReview}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-60">
                  {isSubmittingReview ? 'Submitting…' : '⭐ Submit Review'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {canGetInvoice && (
            <button
              onClick={invoice ? () => setShowInvoice(true) : handleGenerateInvoice}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors text-sm"
            >
              <FileText size={16} /> {invoice ? 'View Invoice' : 'Generate Invoice'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-400 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              <XCircle size={16} /> Cancel Booking
            </button>
          )}
        </div>

        <div className="text-center">
          <Link href="/dashboard/bookings" className="text-sm text-primary hover:underline">← Back to all bookings</Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-heading font-semibold text-lg text-on-surface mb-1">Cancel Booking</h3>
            <p className="text-sm text-on-surface-variant mb-4">This action cannot be undone. Please provide a reason for cancellation.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Reason for cancellation..."
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm resize-none focus:outline-none focus:border-primary mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={isCancelling} className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
                {isCancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">Keep Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
