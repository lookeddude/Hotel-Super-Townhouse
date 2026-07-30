/**
 * app/api/payments/verify/route.ts
 * POST — Verify Razorpay payment signature server-side.
 *
 * Security:
 * - HMAC-SHA256 signature verification (the only trusted verification)
 * - Payment status updated only after signature verified
 * - Booking confirmed only after payment verified
 * - Idempotent — safe to call multiple times
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { razorpayProvider } from '@/lib/payments/providers/razorpay';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentRecordId, bookingId } = body as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      paymentRecordId: string;
      bookingId: string;
    };

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !paymentRecordId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = createServiceClient();

    // 2. Verify signature (HMAC-SHA256)
    const verifyResult = await razorpayProvider.verifyPayment!({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      bookingId,
    });

    if (!verifyResult.success) {
      // Log failed verification attempt
      await db.from('payments').update({
        status: 'failed',
        failure_reason: verifyResult.error ?? 'Signature verification failed',
        gateway_response: { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId },
      }).eq('id', paymentRecordId);

      return NextResponse.json({ error: verifyResult.error ?? 'Payment verification failed' }, { status: 400 });
    }

    // 3. Update payment record → paid
    const { data: payment, error: payErr } = await db
      .from('payments')
      .update({
        status: 'paid',
        gateway_payment_id: razorpayPaymentId,
        gateway_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
        gateway_response: {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        },
      })
      .eq('id', paymentRecordId)
      .select('id, amount, booking_id')
      .single();

    if (payErr || !payment) {
      return NextResponse.json({ error: 'Failed to update payment record' }, { status: 500 });
    }

    // 4. Update booking → confirmed + payment_status = paid
    const { data: booking } = await db
      .from('bookings')
      .update({
        payment_status: 'paid',
        balance_amount: 0,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', payment.booking_id)
      .select('id, booking_reference')
      .single();

    // 5. Auto-generate invoice
    try {
      await db.rpc('generate_invoice_record', { p_booking_id: payment.booking_id });
    } catch {
      // Non-fatal — invoice can be generated manually
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      bookingReference: booking?.booking_reference,
      amount: Number(payment.amount),
      status: 'paid',
    });
  } catch (err) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
