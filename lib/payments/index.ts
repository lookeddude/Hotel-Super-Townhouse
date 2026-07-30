/**
 * lib/payments/index.ts
 * Provider registry — returns the correct payment provider by method key.
 * Add new providers here without touching booking logic.
 */

import type { PaymentProvider, PaymentMethodKey } from './types';
import { razorpayProvider } from './providers/razorpay';
import { payAtHotelProvider } from './providers/pay-at-hotel';

const PROVIDERS: Record<string, PaymentProvider> = {
  online:       razorpayProvider,
  pay_at_hotel: payAtHotelProvider,
  cash:         payAtHotelProvider,
  upi:          razorpayProvider,   // future: dedicated UPI QR provider
  card:         razorpayProvider,   // future: dedicated card provider
  bank_transfer: payAtHotelProvider,
  other:        payAtHotelProvider,
};

export function getPaymentProvider(method: PaymentMethodKey): PaymentProvider {
  return PROVIDERS[method] ?? payAtHotelProvider;
}

export { razorpayProvider, payAtHotelProvider };
export type { PaymentProvider, PaymentMethodKey };
export * from './types';
