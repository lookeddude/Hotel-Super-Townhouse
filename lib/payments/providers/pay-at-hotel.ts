/**
 * lib/payments/providers/pay-at-hotel.ts
 * Pay at Hotel / Cash / Card-at-desk provider.
 * No external gateway — records manual payment, confirms booking.
 */

import type {
  PaymentProvider,
  CreateOrderInput,
  CreateOrderResult,
} from '../types';

export const payAtHotelProvider: PaymentProvider = {
  name: 'pay_at_hotel',

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // Pay-at-hotel has no external order — just return a local reference
    return {
      success: true,
      orderId: `PAH-${Date.now()}-${input.bookingId.slice(0, 8)}`,
      amount: input.amount,
      currency: input.currency,
      keyId: 'pay_at_hotel',
    };
  },
};
