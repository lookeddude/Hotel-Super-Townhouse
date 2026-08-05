'use client';
/**
 * features/rooms/RoomBookingWidget.tsx
 * Sticky booking widget on the room detail page.
 * Lets customers select dates/guests and go to the booking wizard.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR, calculateNights } from '@/services/pricingService';
import { Calendar, Users, Coffee, ArrowRight } from 'lucide-react';

interface Props {
  roomType: any;
  rooms: any[];
  effectivePrice: number;
}

export function RoomBookingWidget({ roomType, rooms, effectivePrice }: Props) {
  const router = useRouter();
  // Use local date to avoid wrong date for IST users (not UTC toISOString)
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const total = effectivePrice * nights;
  const availableCount = rooms.filter(r => r.status === 'available').length;

  const handleBook = () => {
    if (!checkIn || !checkOut) {
      // Go to /book with pre-filled room type
      router.push(`/book?roomTypeId=${roomType.id}`);
      return;
    }
    router.push(`/book?roomTypeId=${roomType.id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
      {/* Price Header */}
      <div className="bg-primary p-5 text-white">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-heading">{formatINR(effectivePrice)}</span>
          <span className="text-white/70 text-sm">/ night</span>
        </div>
        {roomType.weekend_price && roomType.weekend_price !== roomType.base_price && (
          <p className="text-white/70 text-xs mt-0.5">Weekend: {formatINR(roomType.weekend_price)}/night</p>
        )}
        {roomType.breakfast_included && (
          <div className="flex items-center gap-1.5 mt-2 text-white/90 text-xs">
            <Coffee size={12} /> Breakfast included
          </div>
        )}
      </div>

      {/* Date & Guest Inputs */}
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-1 block flex items-center gap-1.5">
            <Calendar size={11} /> Check-in
          </label>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-1 block flex items-center gap-1.5">
            <Calendar size={11} /> Check-out
          </label>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-on-surface-variant mb-1 block flex items-center gap-1.5">
            <Users size={11} /> Adults
          </label>
          <select
            value={adults}
            onChange={e => setAdults(Number(e.target.value))}
            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            {Array.from({ length: roomType.max_adults ?? 4 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Price Preview */}
        {nights > 0 && (
          <div className="bg-surface rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{formatINR(effectivePrice)} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span>{formatINR(total)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant text-xs">
              <span>Est. GST ({effectivePrice > 7500 ? '18' : '12'}%)</span>
              <span>{formatINR(Math.round(total * (effectivePrice > 7500 ? 0.18 : 0.12)))}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-outline-variant pt-1.5 text-on-surface">
              <span>Est. Total</span>
              <span className="text-primary">{formatINR(Math.round(total * (effectivePrice > 7500 ? 1.18 : 1.12)))}</span>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={handleBook}
          disabled={availableCount === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {availableCount === 0 ? 'Not Available' : 'Book Now'} {availableCount > 0 && <ArrowRight size={16} />}
        </button>

        {availableCount > 0 && (
          <p className="text-center text-xs text-on-surface-variant">
            {availableCount} room{availableCount > 1 ? 's' : ''} available · Free cancellation
          </p>
        )}
      </div>
    </div>
  );
}
