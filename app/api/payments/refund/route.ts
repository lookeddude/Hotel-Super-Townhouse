/**
 * app/api/payments/refund/route.ts
 * POST — Admin-only refund initiation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { razorpayProvider } from '@/lib/payments/providers/razorpay';

const ADMIN_ROLES = ['admin', 'super_admin', 'manager'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    // Verify admin role
    const { data: roles } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id);
    const roleNames = (roles ?? []).map((r: any) => (r.roles as any)?.name).filter(Boolean);
    if (!roleNames.some((r: string) => ADMIN_ROLES.includes(r))) {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { paymentId, amount, reason, notes } = await req.json();
    if (!paymentId || !amount || !reason) {
      return NextResponse.json({ error: 'paymentId, amount, and reason are required' }, { status: 400 });
    }

    // Fetch payment
    const { data: payment } = await db
      .from('payments')
      .select('id, booking_id, status, amount, refund_amount, method, gateway_payment_id')
      .eq('id', paymentId)
      .single();

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.status !== 'paid') return NextResponse.json({ error: 'Only paid payments can be refunded' }, { status: 400 });

    const alreadyRefunded = Number(payment.refund_amount ?? 0);
    const refundable = Number(payment.amount) - alreadyRefunded;
    if (amount > refundable) {
      return NextResponse.json({ error: `Maximum refundable amount is ₹${refundable}` }, { status: 400 });
    }

    // Create refund record
    const { data: refundRecord, error: refundErr } = await db
      .from('refunds')
      .insert({
        payment_id: paymentId,
        booking_id: payment.booking_id,
        amount,
        reason,
        notes,
        status: 'processing',
        initiated_by: session.user.id,
      })
      .select('id')
      .single();

    if (refundErr) return NextResponse.json({ error: 'Failed to create refund record' }, { status: 500 });

    // Initiate via Razorpay (only for online payments)
    let razorpayRefundId: string | undefined;
    if (payment.method === 'online' && payment.gateway_payment_id) {
      const refundResult = await razorpayProvider.refund!({
        paymentId,
        amount,
        reason,
        initiatedBy: session.user.id,
        notes,
      });

      if (!refundResult.success) {
        // Mark as failed but keep record
        await db.from('refunds').update({ status: 'failed', notes: refundResult.error }).eq('id', refundRecord.id);
        return NextResponse.json({ error: refundResult.error }, { status: 502 });
      }
      razorpayRefundId = refundResult.razorpayRefundId;

      await db.from('refunds').update({
        razorpay_refund_id: razorpayRefundId,
        status: 'processing',
      }).eq('id', refundRecord.id);
    } else {
      // Manual refund (pay-at-hotel etc) — mark done immediately
      const newRefundTotal = alreadyRefunded + amount;
      const isFullRefund = newRefundTotal >= Number(payment.amount);
      await db.from('payments').update({
        refund_amount: newRefundTotal,
        refunded_at: new Date().toISOString(),
        status: isFullRefund ? 'refunded' : 'partially_refunded',
      }).eq('id', paymentId);
      await db.from('refunds').update({ status: 'done' }).eq('id', refundRecord.id);
    }

    return NextResponse.json({
      success: true,
      refundId: refundRecord.id,
      razorpayRefundId,
      amount,
      status: 'processing',
    });
  } catch (err) {
    console.error('[refund]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
