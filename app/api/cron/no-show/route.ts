/**
 * app/api/cron/no-show/route.ts
 * Vercel Cron Job — Auto No Show
 *
 * Runs daily at midnight IST (18:30 UTC).
 * Marks all pending/confirmed bookings whose check_in date has passed as 'no_show'.
 * Frees the room back to available.
 *
 * Protected by CRON_SECRET env variable (Vercel sends this automatically for cron jobs).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/** Returns today's date in IST (UTC+5:30) as YYYY-MM-DD */
function getISTDateStr(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5h30m in ms
  const ist = new Date(now.getTime() + istOffset);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret (if set)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const db = supabase as any;

  // Today in IST — any booking with check_in < today has passed
  const todayIST = getISTDateStr();

  console.log(`[cron/no-show] Running auto no-show for dates before ${todayIST}`);

  // Find all overdue pending/confirmed bookings
  const { data: overdueBookings, error: fetchErr } = await db
    .from('bookings')
    .select('id, booking_reference, booking_rooms(room_id)')
    .in('status', ['pending', 'confirmed'])
    .lt('check_in', todayIST);

  if (fetchErr) {
    console.error('[cron/no-show] Fetch error:', fetchErr);
    return NextResponse.json({ error: 'Failed to fetch bookings', detail: fetchErr.message }, { status: 500 });
  }

  if (!overdueBookings?.length) {
    console.log('[cron/no-show] No overdue bookings found.');
    return NextResponse.json({ success: true, marked: 0, todayIST });
  }

  const bookingIds = overdueBookings.map((b: any) => b.id);

  // Batch-mark all as no_show
  const { error: updateErr } = await db
    .from('bookings')
    .update({ status: 'no_show' })
    .in('id', bookingIds);

  if (updateErr) {
    console.error('[cron/no-show] Update error:', updateErr);
    return NextResponse.json({ error: 'Failed to update bookings', detail: updateErr.message }, { status: 500 });
  }

  // Free each room back to available
  const roomFreeResults: string[] = [];
  for (const booking of overdueBookings) {
    const br = Array.isArray(booking.booking_rooms)
      ? booking.booking_rooms[0]
      : booking.booking_rooms;
    if (br?.room_id) {
      await db.from('rooms').update({ status: 'available' }).eq('id', br.room_id);
      roomFreeResults.push(br.room_id);
    }
  }

  console.log(`[cron/no-show] Marked ${bookingIds.length} bookings as no_show. Freed rooms: ${roomFreeResults.length}`);

  return NextResponse.json({
    success:       true,
    marked:        bookingIds.length,
    roomsFreed:    roomFreeResults.length,
    bookingIds,
    todayIST,
  });
}
