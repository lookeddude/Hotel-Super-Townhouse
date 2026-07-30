/**
 * lib/payments/providers/razorpay.ts
 * SERVER-ONLY — Never import in client components.
 * Razorpay payment provider implementation.
 */

import crypto from 'crypto';
import type {
  PaymentProvider,
  CreateOrderInput,
  CreateOrderResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
} from '../types';

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_API_URL    = 'https://api.razorpay.com/v1';

function isConfigured(): boolean {
  return !!(
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET &&
    !RAZORPAY_KEY_ID.includes('REPLACE') &&
    !RAZORPAY_KEY_SECRET.includes('REPLACE')
  );
}

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

async function razorpayRequest(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${RAZORPAY_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.description || `Razorpay API error: ${res.status}`);
  }
  return res.json();
}

export const razorpayProvider: PaymentProvider = {
  name: 'razorpay',

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!isConfigured()) {
      return {
        success: false,
        error: 'Razorpay is not configured. Please add RAZORPAY_KEY_SECRET to your environment variables.',
      };
    }

    try {
      // Amount in paise (INR × 100)
      const amountPaise = Math.round(input.amount * 100);

      const order = await razorpayRequest('/orders', 'POST', {
        amount: amountPaise,
        currency: input.currency,
        receipt: input.bookingId.slice(0, 40),
        notes: {
          booking_id: input.bookingId,
          customer_id: input.customerId,
          customer_name: input.customerName,
          ...input.notes,
        },
      });

      return {
        success: true,
        orderId: order.id,
        amount: input.amount,
        currency: input.currency,
        keyId: RAZORPAY_KEY_ID,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Razorpay order',
      };
    }
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!isConfigured()) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      // HMAC-SHA256 verification — the only trusted way to verify payment
      const body = `${input.orderId}|${input.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== input.signature) {
        return { success: false, error: 'Invalid payment signature — payment not verified' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signature verification failed',
      };
    }
  },

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!isConfigured()) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      // Fetch our payment record to get gateway_payment_id
      const { createServiceClient } = await import('@/lib/supabase/service');
      const supabase = createServiceClient();
      const { data: payment } = await supabase
        .from('payments')
        .select('gateway_payment_id, amount')
        .eq('id', input.paymentId)
        .single();

      if (!payment?.gateway_payment_id) {
        return { success: false, error: 'No gateway payment ID found — cannot refund' };
      }

      const refundAmountPaise = Math.round(input.amount * 100);
      const rzpRefund = await razorpayRequest(
        `/payments/${payment.gateway_payment_id}/refund`,
        'POST',
        {
          amount: refundAmountPaise,
          notes: { reason: input.reason, initiated_by: input.initiatedBy },
        }
      );

      return {
        success: true,
        razorpayRefundId: rzpRefund.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  },
};

/** Verify a Razorpay webhook signature */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export { isConfigured as isRazorpayConfigured };
