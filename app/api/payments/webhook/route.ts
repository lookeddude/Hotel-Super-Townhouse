/**
 * app/api/payments/webhook/route.ts
 * POST — Razorpay webhook receiver.
 *
 * Security:
 * - Verifies X-Razorpay-Signature header (HMAC-SHA256)
 * - Idempotent via event_id dedup in payment_webhooks table
 * - Uses service-role client (bypasses RLS — trusted server op)
 * - Raw body read before JSON parse (signature must be over raw body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyWebhookSignature } from '@/lib/payments/providers/razorpay';

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // 1. Verify webhook signature
  if (webhookSecret && !webhookSecret.includes('REPLACE')) {
    const valid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!valid) {
      console.warn('[webhook] Invalid signature — rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    // Webhook secret not yet configured — log but don't reject (dev mode)
    console.warn('[webhook] RAZORPAY_WEBHOOK_SECRET not configured — skipping signature check');
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = payload.id as string;
  const event = payload.event as string;

  if (!eventId || !event) {
    return NextResponse.json({ error: 'Missing event id or event type' }, { status: 400 });
  }

  const db = createServiceClient();

  // 2. Idempotency check — skip if already processed
  const { data: existing } = await db
    .from('payment_webhooks')
    .select('id, processed')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing?.processed) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // 3. Log webhook event
  await db.from('payment_webhooks').upsert(
    { event_id: eventId, event, payload, processed: false },
    { onConflict: 'event_id' }
  );

  // 4. Handle events
  try {
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload?.payment?.entity;
        if (payment) await handlePaymentCaptured(db, payment);
        break;
      }
      case 'payment.failed': {
        const payment = payload.payload?.payment?.entity;
        if (payment) await handlePaymentFailed(db, payment);
        break;
      }
      case 'refund.processed': {
        const refund = payload.payload?.refund?.entity;
        if (refund) await handleRefundProcessed(db, refund);
        break;
      }
      case 'order.paid': {
        const order = payload.payload?.order?.entity;
        if (order) await handleOrderPaid(db, order);
        break;
      }
      default:
        console.log(`[webhook] Unhandled event: ${event}`);
    }

    // Mark as processed
    await db
      .from('payment_webhooks')
      .update({ processed: true })
      .eq('event_id', eventId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[webhook] Processing error:', errorMsg);
    await db
      .from('payment_webhooks')
      .update({ error: errorMsg })
      .eq('event_id', eventId);
    return NextResponse.json({ received: true, error: errorMsg }, { status: 200 });
    // Always return 200 to Razorpay so they don't retry indefinitely
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCaptured(db: any, payment: any) {
  const orderId = payment.order_id;
  const paymentId = payment.id;

  // Find our payment record by gateway order ID
  const { data: payRecord } = await db
    .from('payments')
    .select('id, booking_id, status')
    .eq('gateway_order_id', orderId)
    .maybeSingle();

  if (!payRecord || payRecord.status === 'paid') return; // Already handled

  await db.from('payments').update({
    status: 'paid',
    gateway_payment_id: paymentId,
    paid_at: new Date().toISOString(),
    gateway_response: payment,
  }).eq('id', payRecord.id);

  await db.from('bookings').update({
    payment_status: 'paid',
    balance_amount: 0,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  }).eq('id', payRecord.booking_id);

  // Auto-generate invoice
  try {
    await db.rpc('generate_invoice_record', { p_booking_id: payRecord.booking_id });
  } catch { /* non-fatal */ }
}

async function handlePaymentFailed(db: any, payment: any) {
  const orderId = payment.order_id;
  await db.from('payments').update({
    status: 'failed',
    failure_reason: payment.error_description ?? payment.error_code ?? 'Payment failed',
    gateway_response: payment,
  }).eq('gateway_order_id', orderId);
}

async function handleRefundProcessed(db: any, refund: any) {
  await db.from('refunds').update({
    status: 'done',
    razorpay_refund_id: refund.id,
    gateway_response: refund,
  }).eq('razorpay_refund_id', refund.id);

  // Update payment refund amount
  if (refund.payment_id) {
    const { data: payment } = await db
      .from('payments')
      .select('amount, refund_amount')
      .eq('gateway_payment_id', refund.payment_id)
      .maybeSingle();

    if (payment) {
      const newRefund = Number(payment.refund_amount ?? 0) + Number(refund.amount) / 100;
      const isFullRefund = newRefund >= Number(payment.amount);
      await db.from('payments').update({
        refund_amount: newRefund,
        refunded_at: new Date().toISOString(),
        status: isFullRefund ? 'refunded' : 'partially_refunded',
      }).eq('gateway_payment_id', refund.payment_id);
    }
  }
}

async function handleOrderPaid(db: any, order: any) {
  // Belt-and-suspenders: ensure booking is confirmed
  const { data: payRecord } = await db
    .from('payments')
    .select('booking_id, status')
    .eq('gateway_order_id', order.id)
    .maybeSingle();

  if (payRecord && payRecord.status !== 'paid') {
    await db.from('bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
    }).eq('id', payRecord.booking_id);
  }
}
