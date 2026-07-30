'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getAvailableRooms, createAdminBooking } from '@/services/bookingService';
import { calculatePriceBreakdown, validateOffer, formatINR, calculateNights } from '@/services/pricingService';
import { toast } from 'sonner';
import { ArrowLeft, BedDouble, Users, Search, CheckCircle2, Tag } from 'lucide-react';

const STEPS = ['Dates & Guests', 'Select Room', 'Guest Details', 'Price Summary'];

export default function AdminNewBookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <AdminNewBookingPageInner />
    </Suspense>
  );
}

function AdminNewBookingPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { supabase } = useSupabase();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Step 2
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Step 3
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pay_at_hotel');
  const [promoCode, setPromoCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [internalNotes, setInternalNotes] = useState('');

  // Step 4 - summary
  const [bookingResult, setBookingResult] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];
  const inputClass = 'w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-colors';

  const loadRooms = useCallback(async () => {
    if (!checkIn || !checkOut) return;
    setIsLoading(true);
    const { data } = await getAvailableRooms(supabase as any, checkIn, checkOut, adults);
    setAvailableRooms(data ?? []);
    setIsLoading(false);
  }, [supabase, checkIn, checkOut, adults]);

  useEffect(() => {
    if (step === 1) loadRooms();
  }, [step, loadRooms]);

  useEffect(() => {
    if (selectedRoom) {
      setBreakfastIncluded(!!selectedRoom.breakfast_included);
    }
  }, [selectedRoom]);

  const price = selectedRoom
    ? calculatePriceBreakdown({
        checkIn, checkOut,
        basePrice: Number(selectedRoom.override_price || selectedRoom.base_price),
        weekendPrice: Number(selectedRoom.weekend_price || 0),
        overridePrice: Number(selectedRoom.override_price || 0),
        breakfastIncluded,
        breakfastPricePerNight: Number(selectedRoom.breakfast_price || 0),
        discountAmount,
      })
    : null;

  const handleApplyPromo = async () => {
    if (!promoCode || !price) return;
    const result = await validateOffer(supabase as any, promoCode, checkIn, checkOut, price.subtotal);
    if (!result.valid) { toast.error(result.error ?? 'Invalid promo code'); return; }
    setAppliedOffer(result.offer);
    setDiscountAmount(result.discount ?? 0);
    toast.success(`Promo applied! You save ${formatINR(result.discount ?? 0)}`);
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !guestName || !guestEmail) { toast.error('Please fill all required fields'); return; }
    // Find or create guest profile
    const db = supabase as any;
    const { data: existingUser } = await db.from('profiles').select('id').eq('email', guestEmail).maybeSingle();
    if (!existingUser) {
      toast.error('Guest email not found in profiles. Ask guest to register first or create account via Supabase admin.');
      setIsLoading(false);
      return;
    }
    const resolvedGuestId: string = existingUser.id;

    setIsLoading(true);
    const { data, error } = await createAdminBooking(supabase as any, {
      guestId: resolvedGuestId,
      roomId: selectedRoom.room_id,
      checkIn, checkOut,
      numAdults: adults,
      numChildren: children,
      pricePerNight: Number(selectedRoom.override_price || selectedRoom.base_price),
      breakfastIncluded,
      breakfastPricePerNight: Number(selectedRoom.breakfast_price || 0),
      discountAmount,
      offerId: appliedOffer?.id,
      specialRequests,
      arrivalTime: arrivalTime || undefined,
      paymentMethod,
      source: 'reception',
      guestName,
      guestEmail,
      guestPhone,
      internalNotes,
    });
    setIsLoading(false);
    if (error || !data?.success) {
      toast.error(data?.error ?? error?.message ?? 'Booking failed');
      return;
    }
    setBookingResult(data);
    setStep(3);
  };

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/admin/bookings')} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary mb-2">
          <ArrowLeft size={15} /> Back to Bookings
        </button>
        <h1 className="font-heading text-headline-md text-on-surface">Create New Booking</h1>
        <p className="text-sm text-on-surface-variant">Manual reservation — Reception / Admin</p>
      </div>

      {/* Success */}
      {bookingResult && step === 3 ? (
        <div className="bg-white rounded-xl border border-outline-variant p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-on-surface mb-2">Booking Created!</h2>
          <p className="text-on-surface-variant mb-4">Booking reference:</p>
          <p className="font-mono font-bold text-3xl text-primary mb-6">{bookingResult.booking_reference}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-left bg-surface rounded-lg p-4 mb-6">
            <div><p className="text-xs text-on-surface-variant">Status</p><p className="font-medium capitalize">{bookingResult.status}</p></div>
            <div><p className="text-xs text-on-surface-variant">Total</p><p className="font-bold text-primary">{formatINR(Number(bookingResult.total_amount))}</p></div>
            <div><p className="text-xs text-on-surface-variant">Check-in</p><p className="font-medium">{checkIn}</p></div>
            <div><p className="text-xs text-on-surface-variant">Check-out</p><p className="font-medium">{checkOut}</p></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(`/admin/bookings/${bookingResult.booking_id}`)} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg text-sm">
              View Booking
            </button>
            <button onClick={() => router.push('/admin/bookings')} className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm">
              All Bookings
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i <= step ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant border border-outline-variant'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? 'bg-primary' : 'bg-outline-variant'}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: Dates & Guests */}
          {step === 0 && (
            <div className="bg-white rounded-xl border border-outline-variant p-6 space-y-4">
              <h2 className="font-semibold text-on-surface">Dates & Guests</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Check-in *</label>
                  <input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Check-out *</label>
                  <input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Adults</label>
                  <select value={adults} onChange={e => setAdults(Number(e.target.value))} className={inputClass}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Children</label>
                  <select value={children} onChange={e => setChildren(Number(e.target.value))} className={inputClass}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : ''}</option>)}
                  </select>
                </div>
              </div>
              {nights > 0 && <p className="text-sm text-primary font-medium">{nights} night{nights > 1 ? 's' : ''} selected</p>}
              <button
                onClick={() => {
                  if (!checkIn || !checkOut) { toast.error('Select both dates'); return; }
                  if (checkOut <= checkIn) { toast.error('Check-out must be after check-in'); return; }
                  setStep(1);
                }}
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
              >
                Search Available Rooms →
              </button>
            </div>
          )}

          {/* Step 1: Room Selection */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-outline-variant p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-on-surface">Select Room</h2>
                <span className="text-xs text-on-surface-variant">{checkIn} → {checkOut} · {adults} adult{adults > 1 ? 's' : ''}</span>
              </div>
              {isLoading ? (
                <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />)}</div>
              ) : availableRooms.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <BedDouble size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No rooms available for selected dates</p>
                  <button onClick={() => setStep(0)} className="text-primary text-sm mt-2">← Change dates</button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {availableRooms.map((room: any) => (
                    <button
                      key={room.room_id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedRoom?.room_id === room.room_id ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/40'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-on-surface">{room.room_type_name} — Room {room.room_number}</p>
                          <div className="flex gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                            {room.bed_type && <span className="capitalize">{room.bed_type}</span>}
                            {room.size_sqft && <span>{room.size_sqft} sq ft</span>}
                            <span className="flex items-center gap-1"><Users size={10} /> Up to {room.max_adults}</span>
                            {room.view_type && <span className="capitalize">{room.view_type} view</span>}
                          </div>
                          {room.breakfast_included && <span className="text-xs text-green-600 mt-1 block">✓ Breakfast included</span>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-primary">{formatINR(Number(room.override_price || room.base_price))}</p>
                          <p className="text-xs text-on-surface-variant">/night</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">← Back</button>
                <button onClick={() => { if (!selectedRoom) { toast.error('Select a room'); return; } setStep(2); }} className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Guest Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-outline-variant p-6 space-y-4">
              <h2 className="font-semibold text-on-surface">Guest Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface mb-1 block">Full Name *</label>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)} className={inputClass} placeholder="Guest full name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Email *</label>
                  <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className={inputClass} placeholder="guest@email.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Phone</label>
                  <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Expected Arrival Time</label>
                  <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface mb-1 block">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputClass}>
                    <option value="pay_at_hotel">Pay at Hotel</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                {selectedRoom?.breakfast_included !== null && (
                  <div className="col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="breakfast" checked={breakfastIncluded} onChange={e => setBreakfastIncluded(e.target.checked)} className="w-4 h-4 accent-primary" />
                    <label htmlFor="breakfast" className="text-sm text-on-surface cursor-pointer">
                      Include Breakfast Package {selectedRoom?.breakfast_price > 0 ? `(+${formatINR(Number(selectedRoom.breakfast_price))}/night)` : '(Complimentary)'}
                    </label>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface mb-1 block">Special Requests</label>
                  <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Any special requests from guest…" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-on-surface mb-1 block">Internal Notes (Staff only)</label>
                  <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Notes visible only to staff…" />
                </div>
              </div>
              {/* Promo Code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className={inputClass + ' pl-8'} placeholder="PROMO CODE" />
                </div>
                <button onClick={handleApplyPromo} className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm hover:bg-surface">Apply</button>
              </div>
              {appliedOffer && <p className="text-green-600 text-xs">✓ {appliedOffer.title} — {formatINR(discountAmount)} off</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">← Back</button>
                <button
                  onClick={() => { if (!guestName || !guestEmail) { toast.error('Name and email required'); return; } setStep(3); }}
                  className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark"
                >
                  Review Summary →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Price Summary */}
          {step === 3 && !bookingResult && price && (
            <div className="bg-white rounded-xl border border-outline-variant p-6 space-y-4">
              <h2 className="font-semibold text-on-surface">Booking Summary</h2>
              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Room</span><span className="font-medium">{selectedRoom?.room_type_name} — {selectedRoom?.room_number}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Dates</span><span>{checkIn} → {checkOut} ({price.nights} nights)</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Guest</span><span>{guestName}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Adults / Children</span><span>{adults} / {children}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Payment</span><span className="capitalize">{paymentMethod.replace('_', ' ')}</span></div>
              </div>
              <div className="border-t border-outline-variant pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Room ({price.nights}n × {formatINR(price.pricePerNight)})</span><span>{formatINR(price.roomSubtotal)}</span></div>
                {price.breakfastSubtotal > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">Breakfast ({price.nights} nights)</span><span>{formatINR(price.breakfastSubtotal)}</span></div>}
                {price.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatINR(price.discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-on-surface-variant">GST ({(price.taxRate * 100).toFixed(0)}%)</span><span>{formatINR(price.totalTax)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-outline-variant pt-2">
                  <span>Total Payable</span><span className="text-primary text-xl">{formatINR(price.totalAmount)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">← Edit</button>
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-3 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark disabled:opacity-60">
                  {isLoading ? 'Creating Booking…' : '✓ Confirm & Create Booking'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
