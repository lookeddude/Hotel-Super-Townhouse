'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';
import {
  CalendarDays,
  Users,
  BedDouble,
  UserCircle,
  Receipt,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Coffee,
  Clock,
  CreditCard,
  Hotel,
  Tag,
  AlertCircle,
  Maximize2,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';

import { PhoneInput } from '@/components/shared/PhoneInput';

import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getAvailableRooms, createBooking } from '@/services/bookingService';
import {
  calculatePriceBreakdown,
  validateOffer,
  formatINR,
  formatDate,
  type PriceBreakdown,
} from '@/services/pricingService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableRoom {
  room_id: string;
  room_number: string;
  floor: number | null;
  wing: string | null;
  room_type_id: string;
  room_type_name: string;
  bed_type: string;
  max_occupancy: number;
  size_sqft: number | null;
  base_price: number;
  weekend_price: number | null;
  override_price: number | null;
  breakfast_included: boolean;
  breakfast_price_per_night: number;
  effective_price: number;
}

interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  arrivalTime: string;
  breakfastIncluded: boolean;
  paymentMethod: 'pay_at_hotel' | 'online';
}

interface WizardState {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomTypeId: string | null;   // pre-filter: only show this room category
  selectedRoom: AvailableRoom | null;
  guest: GuestDetails;
  promoCode: string;
  appliedOffer: { id: string; title: string; code: string } | null;
  discountAmount: number;
  breakdown: PriceBreakdown | null;
  bookingReference: string | null;
  bookingTotal: number | null;
}

// ─── Step Config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Dates & Guests', icon: CalendarDays },
  { id: 2, label: 'Room',           icon: BedDouble },
  { id: 3, label: 'Your Details',   icon: UserCircle },
  { id: 4, label: 'Summary',        icon: Receipt },
  { id: 5, label: 'Confirmed',      icon: CheckCircle2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // Use local year/month/day — NOT toISOString() which is UTC
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr()    { return localDateStr(0); }
function tomorrowStr() { return localDateStr(1); }

// Returns the day after a given YYYY-MM-DD string
function dayAfter(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function effectivePrice(room: AvailableRoom) {
  return room.override_price && room.override_price > 0
    ? room.override_price
    : room.base_price;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto px-2">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isActive    = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center min-w-[56px]">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isActive
                    ? 'bg-white border-primary text-primary shadow-md'
                    : 'bg-white border-outline-variant text-on-surface-variant'
                  }
                `}
              >
                {isCompleted
                  ? <CheckCircle2 size={18} />
                  : <Icon size={16} />
                }
              </div>
              <span
                className={`text-[10px] mt-1 font-medium text-center leading-tight hidden sm:block ${
                  isActive ? 'text-primary' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 transition-all duration-300 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-outline-variant'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Dates & Guests ───────────────────────────────────────────────────

interface Step1Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
}

function Step1DatesGuests({ state, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    const today = todayStr();
    if (!state.checkIn)  errs.checkIn  = 'Check-in date is required';
    if (!state.checkOut) errs.checkOut = 'Check-out date is required';
    if (state.checkIn && state.checkIn < today)   errs.checkIn  = 'Check-in must be today or later';
    if (state.checkIn && state.checkOut && state.checkOut <= state.checkIn)
      errs.checkOut = 'Check-out must be after check-in';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-heading text-headline-md text-on-surface mb-1">When are you visiting?</h2>
        <p className="text-sm text-on-surface-variant">Choose your stay dates and number of guests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check-in */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Check-in Date <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="date"
              min={todayStr()}
              value={state.checkIn}
              onChange={(e) => {
                const newCheckIn = e.target.value;
                // If check-out is not at least 1 day after new check-in, auto-advance it
                const updates: Partial<typeof state> = { checkIn: newCheckIn };
                if (!state.checkOut || state.checkOut <= newCheckIn) {
                  updates.checkOut = dayAfter(newCheckIn);
                }
                onChange(updates);
              }}
              className={`
                w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white text-on-surface
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
                ${errors.checkIn ? 'border-error' : 'border-outline-variant'}
              `}
            />
          </div>
          {errors.checkIn && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.checkIn}</p>}
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Check-out Date <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="date"
              min={state.checkIn || tomorrowStr()}
              value={state.checkOut}
              onChange={(e) => onChange({ checkOut: e.target.value })}
              className={`
                w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white text-on-surface
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
                ${errors.checkOut ? 'border-error' : 'border-outline-variant'}
              `}
            />
          </div>
          {errors.checkOut && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.checkOut}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Adults */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Adults <span className="text-primary">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ adults: Math.max(1, state.adults - 1) })}
              className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-on-surface-variant"
            >−</button>
            <div className="flex-1 text-center py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-semibold text-sm">
              <span className="flex items-center justify-center gap-2">
                <Users size={14} className="text-on-surface-variant" />
                {state.adults} {state.adults === 1 ? 'Adult' : 'Adults'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ adults: Math.min(4, state.adults + 1) })}
              className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-on-surface-variant"
            >+</button>
          </div>
        </div>

        {/* Children */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">Children</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ children: Math.max(0, state.children - 1) })}
              className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-on-surface-variant"
            >−</button>
            <div className="flex-1 text-center py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-semibold text-sm">
              {state.children} {state.children === 1 ? 'Child' : 'Children'}
            </div>
            <button
              type="button"
              onClick={() => onChange({ children: Math.min(4, state.children + 1) })}
              className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-on-surface-variant"
            >+</button>
          </div>
        </div>
      </div>

      {/* Summary pill */}
      {state.checkIn && state.checkOut && state.checkOut > state.checkIn && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 text-sm text-on-surface animate-scale-in">
          <CalendarDays size={15} className="text-primary shrink-0" />
          <span>
            <strong>{formatDate(state.checkIn)}</strong> → <strong>{formatDate(state.checkOut)}</strong>
            {' · '}{Math.round((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / 86400000)} night(s)
            {' · '}{state.adults} adult{state.adults > 1 ? 's' : ''}
            {state.children > 0 ? `, ${state.children} child${state.children > 1 ? 'ren' : ''}` : ''}
          </span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Search Rooms <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Room Selection ───────────────────────────────────────────────────

interface Step2Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function Step2RoomSelection({ state, onChange, onNext, onBack }: Step2Props) {
  const { supabase } = useSupabase();
  const [allRooms, setAllRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false); // override category filter

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await getAvailableRooms(
        supabase,
        state.checkIn,
        state.checkOut,
        state.adults,
      );
      if (err) {
        setError('Failed to load available rooms. Please try again.');
      } else {
        setAllRooms((data as AvailableRoom[]) ?? []);
      }
      setLoading(false);
    })();
  }, [supabase, state.checkIn, state.checkOut, state.adults]);

  // Apply room type filter unless user chose to see all
  const activeFilter = !showAll && state.roomTypeId;
  const rooms = activeFilter
    ? allRooms.filter(r => r.room_type_id === state.roomTypeId)
    : allRooms;

  // Name of the selected category for display
  const categoryName = allRooms.find(r => r.room_type_id === state.roomTypeId)?.room_type_name ?? '';

  function handleSelect(room: AvailableRoom) {
    onChange({ selectedRoom: room });
  }

  function handleNext() {
    if (!state.selectedRoom) {
      toast.error('Please select a room to continue.');
      return;
    }
    onNext();
  }

  const nights = state.checkIn && state.checkOut
    ? Math.round((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / 86400000)
    : 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-heading text-headline-md text-on-surface mb-1">Select Your Room</h2>
        <p className="text-sm text-on-surface-variant">
          Available for {formatDate(state.checkIn)} → {formatDate(state.checkOut)} · {nights} night{nights !== 1 ? 's' : ''} · {state.adults} adult{state.adults !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Active category filter badge */}
      {activeFilter && categoryName && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <BedDouble size={14} className="text-primary shrink-0" />
          <span className="text-sm text-on-surface flex-1">
            Showing <strong>{categoryName}</strong> rooms only
          </span>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs text-primary hover:underline font-medium shrink-0"
          >
            Show all categories
          </button>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm">Checking availability…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 bg-error/10 border border-error/30 rounded-lg px-4 py-3 text-sm text-error">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="text-center py-16">
          <BedDouble size={40} className="mx-auto text-outline-variant mb-3" />
          {activeFilter && allRooms.length > 0 ? (
            // Filtered rooms are empty but other rooms exist
            <>
              <p className="font-semibold text-on-surface">No {categoryName} rooms available</p>
              <p className="text-sm text-on-surface-variant mt-1">This room category is fully booked for your dates.</p>
              <button
                onClick={() => setShowAll(true)}
                className="mt-3 text-sm text-primary hover:underline font-semibold"
              >
                View all available room categories
              </button>
            </>
          ) : (
            // Truly no rooms at all
            <>
              <p className="font-semibold text-on-surface">No rooms available</p>
              <p className="text-sm text-on-surface-variant mt-1">Try different dates or reduce the number of guests.</p>
            </>
          )}
          <button onClick={onBack} className="mt-4 text-sm text-primary hover:underline font-semibold block mx-auto">
            ← Change Dates
          </button>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) => {
            const price = effectivePrice(room);
            const isSelected = state.selectedRoom?.room_id === room.room_id;
            return (
              <button
                key={room.room_id}
                type="button"
                onClick={() => handleSelect(room)}
                className={`
                  w-full text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-outline-variant bg-white hover:border-primary/50 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                    ${isSelected ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant'}
                  `}>
                    <BedDouble size={22} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-on-surface">{room.room_type_name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                        Room {room.room_number}
                      </span>
                      {room.floor && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          Floor {room.floor}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <BedDouble size={11} />
                        <span className="capitalize">{room.bed_type}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        Up to {room.max_occupancy} guests
                      </span>
                      {room.size_sqft && (
                        <span className="flex items-center gap-1">
                          <Maximize2 size={11} />
                          {room.size_sqft} sq ft
                        </span>
                      )}
                      {room.breakfast_included && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <Coffee size={11} />
                          Breakfast available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-lg text-primary">{formatINR(price)}</p>
                    <p className="text-xs text-on-surface-variant">/night</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{formatINR(price * nights)} total</p>
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-primary/20 text-xs text-primary font-semibold">
                    <CheckCircle2 size={13} />
                    Room selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-outline-variant text-on-surface-variant font-medium rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={!state.selectedRoom}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Guest Details ────────────────────────────────────────────────────

interface Step3Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

const ARRIVAL_TIMES = [
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

function Step3GuestDetails({ state, onChange, onNext, onBack, userEmail, userName }: Step3Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { guest } = state;

  // Pre-fill from auth profile on mount
  useEffect(() => {
    const updates: Partial<GuestDetails> = {};
    if (userEmail && !guest.email)   updates.email    = userEmail;
    if (userName  && !guest.fullName) updates.fullName = userName;
    if (Object.keys(updates).length) onChange({ guest: { ...guest, ...updates } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateGuest(partial: Partial<GuestDetails>) {
    onChange({ guest: { ...guest, ...partial } });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!guest.fullName.trim()) errs.fullName = 'Full name is required';
    if (!guest.email.trim())    errs.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) errs.email = 'Invalid email address';
    if (!guest.phone.trim())    errs.phone    = 'Phone number is required';
    else if (!/^\+?[0-9\s\-()]{7,15}$/.test(guest.phone))  errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  const canBreakfast = state.selectedRoom?.breakfast_included ?? false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-heading text-headline-md text-on-surface mb-1">Your Details</h2>
        <p className="text-sm text-on-surface-variant">Please provide your contact information for the booking.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Full Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={guest.fullName}
            onChange={(e) => updateGuest({ fullName: e.target.value })}
            placeholder="As per ID proof"
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm bg-white text-on-surface
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
              ${errors.fullName ? 'border-error' : 'border-outline-variant'}
            `}
          />
          {errors.fullName && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Email Address <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            value={guest.email}
            onChange={(e) => updateGuest({ email: e.target.value })}
            placeholder="you@example.com"
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm bg-white text-on-surface
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
              ${errors.email ? 'border-error' : 'border-outline-variant'}
            `}
          />
          {errors.email && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5">
            Phone Number <span className="text-primary">*</span>
          </label>
          <PhoneInput
            value={guest.phone}
            onChange={(val) => updateGuest({ phone: val })}
            error={!!errors.phone}
          />
          {errors.phone && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.phone}</p>}
        </div>
      </div>

      {/* Arrival Time */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">
          Expected Arrival Time
        </label>
        <div className="relative">
          <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <select
            value={guest.arrivalTime}
            onChange={(e) => updateGuest({ arrivalTime: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant text-sm bg-white text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="">Not sure yet</option>
            {ARRIVAL_TIMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breakfast */}
      {canBreakfast && (
        <div
          className={`
            flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
            ${guest.breakfastIncluded ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white hover:border-primary/40'}
          `}
          onClick={() => updateGuest({ breakfastIncluded: !guest.breakfastIncluded })}
        >
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
            ${guest.breakfastIncluded ? 'bg-primary border-primary' : 'border-outline-variant'}
          `}>
            {guest.breakfastIncluded && <CheckCircle2 size={12} className="text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Coffee size={15} className="text-on-surface-variant" />
              <span className="font-semibold text-sm text-on-surface">Add Breakfast</span>
              {state.selectedRoom?.breakfast_price_per_night && (
                <span className="text-xs text-on-surface-variant">
                  (+{formatINR(state.selectedRoom.breakfast_price_per_night)}/night)
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Continental breakfast served from 7:00 AM – 10:30 AM
            </p>
          </div>
        </div>
      )}

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">Special Requests</label>
        <textarea
          value={guest.specialRequests}
          onChange={(e) => updateGuest({ specialRequests: e.target.value })}
          rows={3}
          placeholder="E.g. early check-in, high floor, twin beds, etc. (subject to availability)"
          className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm bg-white text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-2">Payment Method</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            {
              value: 'pay_at_hotel' as const,
              label: 'Pay at Hotel',
              description: 'Pay on check-in via cash or card',
              Icon: Hotel,
              disabled: false,
            },
            {
              value: 'online' as const,
              label: 'Pay Online',
              description: 'Secure online payment (Coming Soon)',
              Icon: CreditCard,
              disabled: true,
            },
          ]).map(({ value, label, description, Icon, disabled }) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && updateGuest({ paymentMethod: value })}
              className={`
                text-left p-4 rounded-xl border-2 transition-all duration-200
                ${guest.paymentMethod === value
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant bg-white hover:border-primary/40'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={guest.paymentMethod === value ? 'text-primary' : 'text-on-surface-variant'} />
                <span className="font-semibold text-sm text-on-surface">{label}</span>
                {disabled && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface rounded-full text-on-surface-variant font-medium">Soon</span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">{description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-outline-variant text-on-surface-variant font-medium rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          Review Summary <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Price Summary ────────────────────────────────────────────────────

interface Step4Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

function Step4PriceSummary({ state, onChange, onNext, onBack, loading }: Step4Props) {
  const { supabase } = useSupabase();
  const [promoInput, setPromoInput] = useState(state.promoCode);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const room = state.selectedRoom;

  // Compute breakdown whenever relevant state changes
  const breakdown = room
    ? calculatePriceBreakdown({
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        basePrice: room.base_price,
        weekendPrice: room.weekend_price ?? undefined,
        overridePrice: room.override_price ?? undefined,
        breakfastIncluded: state.guest.breakfastIncluded,
        breakfastPricePerNight: room.breakfast_price_per_night,
        discountAmount: state.discountAmount,
      })
    : null;

  // Sync breakdown into wizard state
  useEffect(() => {
    onChange({ breakdown });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.checkIn, state.checkOut, state.guest.breakfastIncluded,
    state.discountAmount, room?.room_id,
  ]);

  async function applyPromo() {
    if (!promoInput.trim() || !breakdown) return;
    setPromoLoading(true);
    setPromoError(null);
    const result = await validateOffer(
      supabase,
      promoInput.trim(),
      state.checkIn,
      state.checkOut,
      breakdown.subtotal,
    );
    setPromoLoading(false);
    if (!result.valid) {
      setPromoError(result.error ?? 'Invalid promo code');
      toast.error(result.error ?? 'Invalid promo code');
    } else {
      onChange({
        promoCode:     promoInput.trim().toUpperCase(),
        appliedOffer:  result.offer,
        discountAmount: result.discount ?? 0,
      });
      toast.success(`Promo applied! You save ${formatINR(result.discount ?? 0)}`);
    }
  }

  function removePromo() {
    onChange({ promoCode: '', appliedOffer: null, discountAmount: 0 });
    setPromoInput('');
    setPromoError(null);
  }

  if (!room || !breakdown) return null;

  const LineItem = ({
    label,
    value,
    subtle,
    highlight,
  }: {
    label: string;
    value: string;
    subtle?: boolean;
    highlight?: boolean;
  }) => (
    <div className={`flex items-center justify-between py-2 ${subtle ? 'text-on-surface-variant text-sm' : 'text-on-surface'}`}>
      <span>{label}</span>
      <span className={`font-medium ${highlight ? 'text-green-600' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-heading text-headline-md text-on-surface mb-1">Booking Summary</h2>
        <p className="text-sm text-on-surface-variant">Please confirm your stay details before booking.</p>
      </div>

      {/* Booking summary card */}
      <div className="bg-surface rounded-xl p-4 space-y-1 text-sm">
        <div className="flex items-center gap-2 mb-3">
          <Hotel size={16} className="text-primary" />
          <span className="font-semibold text-on-surface">Super Townhouse, Whitefield</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant">Check-in</p>
            <p className="font-medium text-on-surface">{formatDate(state.checkIn)}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Check-out</p>
            <p className="font-medium text-on-surface">{formatDate(state.checkOut)}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Room</p>
            <p className="font-medium text-on-surface">{room.room_type_name} · #{room.room_number}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Guests</p>
            <p className="font-medium text-on-surface">
              {state.adults} adult{state.adults > 1 ? 's' : ''}
              {state.children > 0 ? `, ${state.children} child${state.children > 1 ? 'ren' : ''}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Guest Name</p>
            <p className="font-medium text-on-surface">{state.guest.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Payment</p>
            <p className="font-medium text-on-surface capitalize">
              {state.guest.paymentMethod === 'pay_at_hotel' ? 'Pay at Hotel' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">
          <Tag size={14} className="inline mr-1 text-primary" />
          Promo Code
        </label>
        {state.appliedOffer ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">{state.appliedOffer.code}</p>
              <p className="text-xs text-green-600">
                {state.appliedOffer.title} · You save {formatINR(state.discountAmount)}
              </p>
            </div>
            <button onClick={removePromo} className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
              placeholder="Enter promo code"
              className={`
                flex-1 px-3 py-2.5 rounded-lg border text-sm bg-white text-on-surface uppercase tracking-widest
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
                ${promoError ? 'border-error' : 'border-outline-variant'}
              `}
            />
            <button
              onClick={applyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </button>
          </div>
        )}
        {promoError && (
          <p className="text-xs text-error mt-1 flex items-center gap-1">
            <AlertCircle size={11} />{promoError}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="border border-outline-variant rounded-xl overflow-hidden">
        <div className="bg-surface px-4 py-2.5 border-b border-outline-variant">
          <p className="text-sm font-semibold text-on-surface">Price Breakdown</p>
        </div>
        <div className="px-4 divide-y divide-outline-variant/60">
          <LineItem
            subtle
            label={`${formatINR(breakdown.pricePerNight)} × ${breakdown.nights} night${breakdown.nights !== 1 ? 's' : ''}`}
            value={formatINR(breakdown.roomSubtotal)}
          />
          {breakdown.breakfastSubtotal > 0 && (
            <LineItem subtle label={`Breakfast × ${breakdown.nights} nights`} value={formatINR(breakdown.breakfastSubtotal)} />
          )}
          {breakdown.discountAmount > 0 && (
            <LineItem subtle highlight label="Promo Discount" value={`− ${formatINR(breakdown.discountAmount)}`} />
          )}
          <LineItem subtle label="Subtotal" value={formatINR(breakdown.subtotal)} />
          {breakdown.taxRate > 0 ? (
            <>
              <LineItem
                subtle
                label={`CGST (${(breakdown.taxRate / 2 * 100).toFixed(0)}%)`}
                value={formatINR(breakdown.cgst)}
              />
              <LineItem
                subtle
                label={`SGST (${(breakdown.taxRate / 2 * 100).toFixed(0)}%)`}
                value={formatINR(breakdown.sgst)}
              />
            </>
          ) : (
            <LineItem subtle label="GST" value="Exempt" />
          )}
        </div>
        <div className="px-4 py-3 bg-primary/5 border-t border-outline-variant flex items-center justify-between">
          <span className="font-semibold text-on-surface">Total Amount</span>
          <span className="font-heading font-bold text-xl text-primary">{formatINR(breakdown.totalAmount)}</span>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        * All prices include applicable GST as per Indian tax regulations.
        Breakfast is subject to availability.
      </p>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-outline-variant text-on-surface-variant font-medium rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Confirming…</>
          ) : (
            <>Confirm Booking <CheckCircle2 size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Confirmation ─────────────────────────────────────────────────────

interface Step5Props {
  state: WizardState;
}

function Step5Confirmation({ state }: Step5Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  // Use local date (not UTC) to avoid wrong date for IST users
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push('/dashboard/bookings');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4 animate-fade-in">
      {/* Success icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <PartyPopper size={36} className="text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <CheckCircle2 size={16} className="text-white" />
        </div>
      </div>

      <div>
        <h2 className="font-heading text-headline-md text-on-surface mb-2">Booking Confirmed!</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          Your reservation has been placed successfully. A confirmation email will be sent shortly.
        </p>
      </div>

      {/* Booking Reference */}
      {state.bookingReference && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-4 w-full max-w-sm">
          <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Booking Reference</p>
          <p className="font-mono font-bold text-2xl text-primary tracking-widest">{state.bookingReference}</p>
        </div>
      )}

      {/* Stay Details */}
      <div className="w-full max-w-sm space-y-0 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-outline-variant/60">
          <span className="text-on-surface-variant">Check-in</span>
          <span className="font-medium text-on-surface">{formatDate(state.checkIn)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-outline-variant/60">
          <span className="text-on-surface-variant">Check-out</span>
          <span className="font-medium text-on-surface">{formatDate(state.checkOut)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-outline-variant/60">
          <span className="text-on-surface-variant">Room</span>
          <span className="font-medium text-on-surface">
            {state.selectedRoom?.room_type_name} · #{state.selectedRoom?.room_number}
          </span>
        </div>
        {state.bookingTotal != null && (
          <div className="flex items-center justify-between py-2">
            <span className="text-on-surface-variant">Total</span>
            <span className="font-bold text-primary text-base">{formatINR(state.bookingTotal)}</span>
          </div>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface rounded-lg px-4 py-2.5">
        <Loader2 size={14} className="animate-spin text-primary shrink-0" />
        Redirecting to your bookings in {countdown}s…
      </div>

      <button
        onClick={() => router.push('/dashboard/bookings')}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
      >
        View My Bookings <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BookPageInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { supabase } = useSupabase();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();

  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [state, setState] = useState<WizardState>(() => {
    // Initialize dates as empty — will be set to today/tomorrow in useEffect
    // (avoids SSR hydration mismatch from build-time vs runtime date)
    const adults = parseInt(params.get('adults') ?? '1', 10) || 1;
    return {
      checkIn:    params.get('checkIn')     ?? '',
      checkOut:   params.get('checkOut')    ?? '',
      roomTypeId: params.get('roomTypeId')  ?? null,
      adults: Math.min(Math.max(adults, 1), 4),
      children: 0,
      selectedRoom: null,
      guest: {
        fullName:          '',
        email:             '',
        phone:             '',
        specialRequests:   '',
        arrivalTime:       '',
        breakfastIncluded: false,
        paymentMethod:     'pay_at_hotel',
      },
      promoCode:      '',
      appliedOffer:   null,
      discountAmount: 0,
      breakdown:      null,
      bookingReference: null,
      bookingTotal:   null,
    };
  });

  // ── Set default dates on client mount ──────────────────────────────────────
  // Runs only in the browser — guarantees correct local today/tomorrow dates
  useEffect(() => {
    setState(prev => ({
      ...prev,
      checkIn:    prev.checkIn    || params.get('checkIn')    || todayStr(),
      checkOut:   prev.checkOut   || params.get('checkOut')   || tomorrowStr(),
      roomTypeId: prev.roomTypeId ?? params.get('roomTypeId') ?? null,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── Auth guard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const redirectPath = encodeURIComponent('/book?' + params.toString());
      router.replace(`/login?redirect=${redirectPath}`);
    }
  }, [authLoading, isAuthenticated, router, params]);

  // ── Wizard helpers ─────────────────────────────────────────────────────────

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  function next() { setStep((s) => Math.min(s + 1, 5)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  // ── Submit booking (Step 4 → 5) ───────────────────────────────────────────

  async function submitBooking() {
    if (!user || !state.selectedRoom || !state.breakdown) return;

    setSubmitting(true);
    try {
      const { data, error } = await createBooking(supabase, {
        guestId:                user.id,
        roomId:                 state.selectedRoom.room_id,
        checkIn:                state.checkIn,
        checkOut:               state.checkOut,
        numAdults:              state.adults,
        numChildren:            state.children,
        pricePerNight:          state.breakdown.pricePerNight,
        breakfastIncluded:      state.guest.breakfastIncluded,
        breakfastPricePerNight: state.selectedRoom.breakfast_price_per_night,
        discountAmount:         state.breakdown.discountAmount,
        offerId:                state.appliedOffer?.id,
        specialRequests:        state.guest.specialRequests || undefined,
        arrivalTime:            state.guest.arrivalTime || undefined,
        paymentMethod:          state.guest.paymentMethod,
        source:                 'website',
        guestName:              state.guest.fullName,
        guestEmail:             state.guest.email,
        guestPhone:             state.guest.phone,
      });

      if (error || !data?.success) {
        toast.error(data?.error ?? error?.message ?? 'Booking failed. Please try again.');
        return;
      }

      update({
        bookingReference: data.booking_reference ?? null,
        bookingTotal:     state.breakdown.totalAmount,
      });
      toast.success('Booking confirmed! 🎉');
      setStep(5);

      // ── Send confirmation email (non-blocking) ──
      try {
        const emailRes = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: 'booking_confirmed',
            to:         state.guest.email,
            toName:     state.guest.fullName,
            vars: {
              name:           state.guest.fullName,
              booking_ref:    data.booking_reference ?? '',
              room_name:      state.selectedRoom!.room_type_name + ' · #' + state.selectedRoom!.room_number,
              check_in:       formatDate(state.checkIn),
              check_out:      formatDate(state.checkOut),
              guests:         state.adults + ' adult' + (state.adults > 1 ? 's' : ''),
              total_amount:   formatINR(state.breakdown!.totalAmount),
              payment_status: state.guest.paymentMethod === 'pay_at_hotel' ? 'Pay at Hotel' : 'Paid Online',
              booking_url:    window.location.origin + '/dashboard/bookings',
            },
          }),
        });
        const emailData = await emailRes.json();
        if (!emailData.success) {
          console.warn('[book] Email send failed:', emailData.error);
        } else {
          console.info('[book] Confirmation email sent via', emailData.provider);
        }
      } catch (emailErr) {
        console.warn('[book] Email fetch error:', emailErr);
      }

      // ── Notify admin (non-blocking) ──
      // Use 'admin_alert' type so this ONLY shows in /admin/notifications
      // and never leaks into the customer /dashboard/notifications
      fetch('/api/notifications/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       'admin_alert',
          title:      `🏨 New Booking — ${data.booking_reference ?? ''}`,
          body:       `${state.guest.fullName} booked ${state.selectedRoom!.room_type_name} · #${state.selectedRoom!.room_number} from ${formatDate(state.checkIn)} to ${formatDate(state.checkOut)} · ${formatINR(state.breakdown!.totalAmount)}`,
          data:       { booking_reference: data.booking_reference, guest_name: state.guest.fullName, guest_email: state.guest.email },
          booking_id: data.id ?? undefined,
        }),
      }).catch(() => console.warn('[book] Admin notification failed silently'));

    } catch (err: any) {
      toast.error(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Auth loading state ─────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Redirect handled in useEffect; render nothing while navigating
  if (!isAuthenticated) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-6">
          <p className="text-label-md text-primary uppercase tracking-widest mb-1">Booking</p>
          <h1 className="font-heading text-headline-lg-mobile sm:text-headline-lg text-on-surface">
            Reserve Your Room
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Super Townhouse — Whitefield ITPL, Bengaluru
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Wizard card */}
        <div className="bg-white border border-outline-variant rounded-xl shadow-card p-6 sm:p-8">
          {step === 1 && (
            <Step1DatesGuests
              state={state}
              onChange={update}
              onNext={next}
            />
          )}
          {step === 2 && (
            <Step2RoomSelection
              state={state}
              onChange={update}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <Step3GuestDetails
              state={state}
              onChange={update}
              onNext={next}
              onBack={back}
              userEmail={user?.email ?? profile?.email}
              userName={profile?.fullName ?? undefined}
            />
          )}
          {step === 4 && (
            <Step4PriceSummary
              state={state}
              onChange={update}
              onNext={submitBooking}
              onBack={back}
              loading={submitting}
            />
          )}
          {step === 5 && (
            <Step5Confirmation state={state} />
          )}
        </div>

        {/* Footer help links */}
        {step < 5 && (
          <p className="text-center text-xs text-on-surface-variant mt-6">
            Need help?{' '}
            <a href="/contact" className="text-primary hover:underline font-medium">Contact us</a>
            {' · '}
            <a href="/policies" className="text-primary hover:underline font-medium">Booking Policy</a>
          </p>
        )}

      </div>
    </div>
  );
}
// ─── Default export wrapped in Suspense (required for useSearchParams) ─────────

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <BookPageInner />
    </Suspense>
  );
}
