/**
 * lib/payments/types.ts
 * Payment provider interface and shared types.
 * All payment providers must implement PaymentProvider.
 */

export type PaymentMethodKey =
  | 'online'
  | 'pay_at_hotel'
  | 'cash'
  | 'upi'
  | 'card'
  | 'bank_transfer'
  | 'other';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded';

export interface CreateOrderInput {
  bookingId: string;
  amount: number;       // in INR (not paise)
  currency: string;     // 'INR'
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  idempotencyKey: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;          // gateway order ID
  paymentRecordId?: string;  // our DB record
  amount?: number;
  currency?: string;
  keyId?: string;            // public key for checkout
  error?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
  bookingId: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  paymentRecordId?: string;
  bookingReference?: string;
  error?: string;
}

export interface RefundInput {
  paymentId: string;    // our DB payment record ID
  amount: number;
  reason: string;
  initiatedBy: string;
  notes?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  razorpayRefundId?: string;
  error?: string;
}

export interface RecordManualPaymentInput {
  bookingId: string;
  amount: number;
  method: PaymentMethodKey;
  collectedBy: string;
  notes?: string;
  transactionRef?: string;
}

export interface RecordManualPaymentResult {
  success: boolean;
  paymentRecordId?: string;
  error?: string;
}

/** All payment providers implement this interface */
export interface PaymentProvider {
  name: string;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment?(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  refund?(input: RefundInput): Promise<RefundResult>;
}
