/**
 * services/pricingService.ts — Phase 6 Pricing & Tax Engine
 *
 * GST Slabs (India):
 *   ≤ ₹2,500/night  → Exempt (0%)
 *   ₹2,501–₹7,500/night → 12% GST (CGST 6% + SGST 6%)
 *   > ₹7,500/night  → 18% GST (CGST 9% + SGST 9%)
 */

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  roomSubtotal: number;
  breakfastSubtotal: number;
  discountAmount: number;
  subtotal: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  totalAmount: number;
  currency: string;
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function calculateNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay)
  );
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ─── Pricing Engine ───────────────────────────────────────────────────────────

export function calculateNightlyRate(
  basePrice: number,
  weekendPrice: number | null | undefined,
  checkIn: string,
  checkOut: string
): number {
  const nights = calculateNights(checkIn, checkOut);
  if (!weekendPrice || weekendPrice <= 0 || nights === 0) return basePrice;

  let total = 0;
  const start = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    const night = new Date(start);
    night.setDate(night.getDate() + i);
    total += isWeekend(night) ? weekendPrice : basePrice;
  }
  return Math.round(total / nights);
}

export function getGstRate(pricePerNight: number): number {
  if (pricePerNight <= 2500) return 0;
  if (pricePerNight <= 7500) return 0.12;
  return 0.18;
}

export function calculatePriceBreakdown(params: {
  checkIn: string;
  checkOut: string;
  basePrice: number;
  weekendPrice?: number;
  overridePrice?: number;
  breakfastIncluded: boolean;
  breakfastPricePerNight: number;
  discountAmount?: number;
}): PriceBreakdown {
  const nights = calculateNights(params.checkIn, params.checkOut);

  // Effective nightly rate
  const effectiveRate = params.overridePrice && params.overridePrice > 0
    ? params.overridePrice
    : calculateNightlyRate(params.basePrice, params.weekendPrice, params.checkIn, params.checkOut);

  const roomSubtotal = effectiveRate * nights;
  const breakfastSubtotal = params.breakfastIncluded
    ? params.breakfastPricePerNight * nights
    : 0;
  const discountAmount = Math.min(params.discountAmount ?? 0, roomSubtotal + breakfastSubtotal);
  const subtotal = roomSubtotal + breakfastSubtotal - discountAmount;

  const taxRate = getGstRate(effectiveRate);
  const totalTax = Math.round(subtotal * taxRate * 100) / 100;
  const cgst = Math.round(totalTax / 2 * 100) / 100;
  const sgst = totalTax - cgst;
  const totalAmount = Math.round((subtotal + totalTax) * 100) / 100;

  return {
    nights,
    pricePerNight: effectiveRate,
    roomSubtotal,
    breakfastSubtotal,
    discountAmount,
    subtotal,
    taxRate,
    cgst,
    sgst,
    totalTax,
    totalAmount,
    currency: 'INR',
  };
}

// ─── Offer Validation ──────────────────────────────────────────────────────────

export async function validateOffer(
  client: any,
  code: string,
  checkIn: string,
  checkOut: string,
  subtotal: number
): Promise<{ valid: boolean; offer?: any; discount?: number; error?: string }> {
  const today = new Date().toISOString().split('T')[0];
  const { data: offer, error } = await client
    .from('offers')
    .select('id, title, code, discount_type, discount_value, min_nights, min_booking_amount, valid_from, valid_until, is_active, usage_limit, used_count')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !offer) return { valid: false, error: 'Invalid promo code' };
  if (offer.valid_from   && offer.valid_from   > today) return { valid: false, error: 'Offer not yet active' };
  if (offer.valid_until  && offer.valid_until  < today) return { valid: false, error: 'Offer has expired' };
  if (offer.usage_limit  && offer.used_count  >= offer.usage_limit) return { valid: false, error: 'Offer usage limit reached' };
  if (offer.min_booking_amount && subtotal < offer.min_booking_amount) return { valid: false, error: `Minimum booking amount ₹${offer.min_booking_amount} required` };

  const nights = calculateNights(checkIn, checkOut);
  if (offer.min_nights && nights < offer.min_nights) return { valid: false, error: `Minimum ${offer.min_nights} nights required` };

  const discount = offer.discount_type === 'percentage'
    ? Math.round(subtotal * (offer.discount_value / 100) * 100) / 100
    : Math.min(offer.discount_value, subtotal);

  return { valid: true, offer, discount };
}


// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
