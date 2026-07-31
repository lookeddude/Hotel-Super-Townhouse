'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getBookingsByGuest } from '@/services/bookingService';
import { formatINR, formatDate } from '@/services/pricingService';
import { Calendar, BedDouble, ChevronRight, CheckCircle2, LogIn } from 'lucide-react';

// Smart payment label shown below the price
function paymentLabel(booking: any): { text: string; color: string } {
  const ps = booking.payment_status ?? 'pending';
  const pm = booking.payment_method ?? '';
  const bs = booking.status ?? '';

  if (bs === 'cancelled') {
    if (ps === 'refunded')           return { text: 'Refunded',       color: 'text-blue-500' };
    if (ps === 'partially_refunded') return { text: 'Part. Refunded', color: 'text-blue-400' };
    return                                  { text: 'Cancelled',      color: 'text-red-400' };
  }
  if (ps === 'paid')                 return { text: 'Paid ✓',          color: 'text-green-600' };
  if (ps === 'partially_refunded')   return { text: 'Part. Refunded', color: 'text-blue-500' };
  if (ps === 'refunded')             return { text: 'Refunded',       color: 'text-blue-500' };
  if (ps === 'failed')               return { text: 'Payment Failed', color: 'text-red-500' };
  // pending / authorized
  if (pm === 'pay_at_hotel' || pm === 'cash')
    return { text: 'Pay at Hotel',   color: 'text-amber-600' };
  if (pm === 'online' || pm === 'card' || pm === 'upi')
    return { text: 'Online — Pending', color: 'text-yellow-600' };
  return   { text: 'Pay at Hotel',   color: 'text-amber-600' };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' },
  checked_in:  { label: 'Checked In',  color: 'bg-green-100 text-green-700' },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700' },
  no_show:     { label: 'No Show',     color: 'bg-orange-100 text-orange-700' },
};

export default function MyBookingsPage() {
  const { supabase } = useSupabase();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [supabase]);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data } = await getBookingsByGuest(supabase as any, userId, { page: 1, perPage: 50 });
    setBookings(data ?? []);
    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length;
  const active = bookings.filter(b => b.status === 'checked_in').length;
  const past = bookings.filter(b => ['checked_out', 'cancelled'].includes(b.status)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant px-6 py-5">
        <h1 className="font-heading text-headline-md text-on-surface">My Bookings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Manage your reservations and stays</p>
      </div>

      <div className="container-custom py-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming', value: upcoming, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active Stay', value: active, icon: LogIn, color: 'text-green-600 bg-green-50' },
            { label: 'Past Stays', value: past, icon: CheckCircle2, color: 'text-gray-600 bg-gray-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-outline-variant p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="font-heading font-bold text-2xl text-on-surface">{s.value}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                filter === s ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-outline-variant animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant py-20 text-center">
            <BedDouble size={40} className="mx-auto text-outline-variant mb-3" />
            <p className="font-semibold text-on-surface">No bookings found</p>
            <p className="text-sm text-on-surface-variant mt-1 mb-5">You haven&apos;t made any reservations yet.</p>
            <Link href="/rooms" className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking: any) => {
              const room = Array.isArray(booking.booking_rooms) ? booking.booking_rooms[0] : null;
              const roomType = room?.room_types;
              const roomInfo = room?.rooms;
              const sc = STATUS_CONFIG[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="bg-white rounded-xl border border-outline-variant p-4 flex items-center gap-4 hover:shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BedDouble size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-on-surface">{roomType?.name ?? 'Room'}</p>
                      {roomInfo?.room_number && (
                        <span className="text-xs text-on-surface-variant">#{roomInfo.room_number}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</span>
                      <span>{booking.nights} night{booking.nights !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-on-surface-variant font-mono">{booking.booking_reference}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-bold text-base text-primary">{formatINR(Number(booking.total_amount))}</p>
                    {(() => { const pl = paymentLabel(booking); return (
                      <p className={`text-xs mt-0.5 font-medium ${pl.color}`}>{pl.text}</p>
                    ); })()}
                  </div>
                  <ChevronRight size={16} className="text-outline group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/rooms" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm">
            <BedDouble size={16} /> Book a New Stay
          </Link>
        </div>
      </div>
    </div>
  );
}
