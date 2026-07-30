/**
 * app/api/payments/pay-at-hotel/route.ts
 * POST — Record a manual payment at reception (cash/card/UPI).
 * Requires admin or reception role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const STAFF_ROLES = ['admin', 'super_admin', 'manager', 'reception'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    // Verify staff role
    const { data: roles } = await db
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id);
    const roleNames = (roles ?? []).map((r: any) => (r.roles as any)?.name).filter(Boolean);
    if (!roleNames.some((r: string) => STAFF_ROLES.includes(r))) {
      return NextResponse.json({ error: 'Forbidden — staff access required' }, { status: 403 });
    }

    const { bookingId, method = 'pay_at_hotel', notes, transactionRef } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    // Fetch booking
    const { data: booking } = await db
      .from('bookings')
      .select('id, total_amount, balance_amount, status, payment_status, booking_reference')
      .eq('id', bookingId)
      .single();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    if (['cancelled', 'no_show'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot record payment for cancelled booking' }, { status: 400 });
    }

    const amount = Number(booking.balance_amount || booking.total_amount);

    // Record payment
    const { data: payRecord, error: payErr } = await db
      .from('payments')
      .insert({
        booking_id: bookingId,
        method,
        status: 'paid',
        amount,
        currency: 'INR',
        gateway_name: 'manual',
        gateway_order_id: transactionRef ?? null,
        paid_at: new Date().toISOString(),
        notes,
        gateway_response: {
          collected_by: session.user.id,
          transaction_ref: transactionRef,
          method,
          notes,
        },
      })
      .select('id, payment_reference')
      .single();

    if (payErr) return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });

    // Update booking
    await db.from('bookings').update({
      payment_status: 'paid',
      balance_amount: 0,
      status: booking.status === 'pending' ? 'confirmed' : booking.status,
      confirmed_at: booking.status === 'pending' ? new Date().toISOString() : undefined,
    }).eq('id', bookingId);

    // Auto-generate invoice
    try {
      await db.rpc('generate_invoice_record', { p_booking_id: bookingId });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      paymentId: payRecord.id,
      paymentReference: payRecord.payment_reference,
      bookingReference: booking.booking_reference,
      amount,
      method,
    });
  } catch (err) {
    console.error('[pay-at-hotel]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
