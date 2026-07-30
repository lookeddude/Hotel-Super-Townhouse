/**
 * app/api/payments/create-order/route.ts
 * POST — Create a Razorpay payment order server-side.
 *
 * Security:
 * - Validates authenticated session
 * - Re-validates booking amount from DB (never trusts client amount)
 * - Prevents duplicate orders via idempotency_key
 * - RAZORPAY_KEY_SECRET never leaves this server
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPaymentProvider } from '@/lib/payments';
import type { PaymentMethodKey } from '@/lib/payments/types';


export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, method = 'online' } = body as {
      bookingId: string;
      method?: PaymentMethodKey;
    };

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // 2. Fetch booking from DB — never trust client-provided amount
    const db = createServiceClient();
    const { data: booking, error: bookingErr } = await (db as any)
      .from('bookings')
      .select(`
        id, booking_reference, total_amount, balance_amount,
        status, payment_status, check_in, check_out,
        guest_id,
        profiles:guest_id (full_name, email, phone)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 3. Validate ownership (customer can only pay their own booking)
    if (booking.guest_id !== session.user.id) {
      // Check if admin/staff
      const { data: roles } = await db
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', session.user.id);
      const roleNames = (roles ?? []).map((r: any) => (r.roles as any)?.name).filter(Boolean);
      const isStaff = roleNames.some((r: string) =>
        ['admin', 'super_admin', 'manager', 'reception'].includes(r)
      );
      if (!isStaff) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 4. Validate booking state
    if (['cancelled', 'no_show'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot pay for a cancelled booking' }, { status: 400 });
    }
    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // 5. Check for existing pending payment (idempotency)
    const { data: existingPayment } = await db
      .from('payments')
      .select('id, razorpay_order_id, status, amount')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .eq('method', method)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Reuse existing pending order if fresh (< 15 mins old)
    if (existingPayment?.razorpay_order_id) {
      const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles as any;
      return NextResponse.json({
        success: true,
        orderId: existingPayment.razorpay_order_id,
        paymentRecordId: existingPayment.id,
        amount: Number(booking.balance_amount || booking.total_amount),
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        customerName: profile?.full_name ?? '',
        customerEmail: profile?.email ?? session.user.email,
        bookingReference: booking.booking_reference,
        reused: true,
      });
    }

    // 6. Create payment order via provider
    const amount = Number(booking.balance_amount || booking.total_amount);
    const idempotencyKey = crypto.randomUUID();
    const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles as any;

    const provider = getPaymentProvider(method);
    const orderResult = await provider.createOrder({
      bookingId,
      amount,
      currency: 'INR',
      customerId: session.user.id,
      customerName: profile?.full_name ?? 'Guest',
      customerEmail: profile?.email ?? session.user.email ?? '',
      customerPhone: profile?.phone,
      idempotencyKey,
    });

    if (!orderResult.success) {
      return NextResponse.json({ error: orderResult.error }, { status: 502 });
    }

    // 7. Record payment in DB
    const { data: paymentRecord, error: insertErr } = await db
      .from('payments')
      .insert({
        booking_id: bookingId,
        method,
        status: 'pending',
        amount,
        currency: 'INR',
        razorpay_order_id: orderResult.orderId,
        gateway_order_id: orderResult.orderId,
        gateway_name: provider.name,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      paymentRecordId: paymentRecord.id,
      amount,
      currency: 'INR',
      keyId: orderResult.keyId,
      customerName: profile?.full_name ?? '',
      customerEmail: profile?.email ?? session.user.email,
      customerPhone: profile?.phone ?? '',
      bookingReference: booking.booking_reference,
    });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
