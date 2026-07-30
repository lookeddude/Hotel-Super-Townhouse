/**
 * services/razorpayClientService.ts
 * Browser-side Razorpay integration.
 * Loads checkout.js dynamically, opens payment modal.
 * NEVER imports or exposes RAZORPAY_KEY_SECRET.
 */

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;         // INR (not paise)
  currency: string;
  keyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingReference?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (err: any) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Dynamically loads Razorpay checkout.js if not already loaded */
async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Open the Razorpay checkout modal */
export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    opts.onError?.('Failed to load Razorpay checkout script');
    return;
  }

  const RazorpayConstructor = (window as any).Razorpay;
  if (!RazorpayConstructor) {
    opts.onError?.('Razorpay not available');
    return;
  }

  const rzp = new RazorpayConstructor({
    key: opts.keyId,
    order_id: opts.orderId,
    amount: Math.round(opts.amount * 100),  // paise
    currency: opts.currency || 'INR',
    name: 'Super Townhouse',
    description: opts.bookingReference ? `Booking ${opts.bookingReference}` : 'Hotel Booking',
    image: '/images/logo.png',
    prefill: {
      name: opts.customerName,
      email: opts.customerEmail,
      contact: opts.customerPhone || '',
    },
    theme: { color: '#e31837' },
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
    handler: (response: RazorpaySuccessResponse) => {
      opts.onSuccess(response);
    },
  });

  rzp.on('payment.failed', (response: any) => {
    opts.onError?.(response?.error?.description ?? 'Payment failed');
  });

  rzp.open();
}

/** Full payment flow: create order → open checkout → verify */
export async function initiateOnlinePayment(params: {
  bookingId: string;
  onSuccess: (bookingReference: string) => void;
  onError: (msg: string) => void;
  onDismiss?: () => void;
}) {
  const { bookingId, onSuccess, onError, onDismiss } = params;

  // Step 1: Create order server-side
  const orderRes = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, method: 'online' }),
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok || !orderData.success) {
    onError(orderData.error ?? 'Failed to create payment order');
    return;
  }

  // Step 2: Open Razorpay checkout
  await openRazorpayCheckout({
    orderId: orderData.orderId,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    keyId: orderData.keyId,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerPhone: orderData.customerPhone,
    bookingReference: orderData.bookingReference,
    onDismiss,
    onError,
    onSuccess: async (rzpResponse) => {
      // Step 3: Verify signature server-side
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
          paymentRecordId: orderData.paymentRecordId,
          bookingId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        onError(verifyData.error ?? 'Payment verification failed');
        return;
      }
      onSuccess(verifyData.bookingReference);
    },
  });
}
