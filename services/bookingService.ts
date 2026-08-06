/**
 * services/bookingService.ts — Phase 6 Complete Implementation
 *
 * DB Schema (actual columns):
 * bookings: id, booking_reference, guest_id, offer_id, status, check_in, check_out,
 *   nights, num_adults, num_children, special_requests, internal_notes, arrival_time,
 *   source, subtotal, discount_amount, tax_amount, total_amount, paid_amount,
 *   balance_amount, currency, payment_status, cancelled_at, cancelled_by,
 *   cancellation_reason, refund_amount, confirmed_at, checked_in_at, checked_out_at
 *
 * booking_rooms: id, booking_id, room_id, room_type_id, price_per_night, total_price,
 *   breakfast_included, extra_bed
 *
 * booking_guests: id, booking_id, full_name, email, phone, is_primary
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyRoleUsers, notifyStaffUsers } from '@/services/notificationService';

type Client = SupabaseClient<any>;

export type BookingStatus =
  | 'pending' | 'confirmed' | 'checked_in' | 'checked_out'
  | 'cancelled' | 'no_show' | 'waitlisted';

// ─── Availability ────────────────────────────────────────────────────────────

export async function checkRoomAvailability(
  client: Client,
  roomId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<boolean> {
  const db = client as any;
  const { data, error } = await db.rpc('check_room_availability', {
    p_room_id: roomId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_exclude_booking_id: excludeBookingId ?? null,
  });
  if (error) return false;
  return data === true;
}

export async function getAvailableRooms(
  client: Client,
  checkIn: string,
  checkOut: string,
  numAdults: number = 1,
  roomTypeId?: string
) {
  const db = client as any;
  const { data, error } = await db.rpc('get_available_rooms', {
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_num_adults: numAdults,
    p_room_type_id: roomTypeId ?? null,
  });
  return { data: data ?? [], error };
}

// ─── Booking Creation ─────────────────────────────────────────────────────────

export interface CreateBookingInput {
  guestId: string;
  roomId: string;
  checkIn: string;         // 'YYYY-MM-DD'
  checkOut: string;        // 'YYYY-MM-DD'
  numAdults: number;
  numChildren: number;
  pricePerNight: number;
  breakfastIncluded: boolean;
  breakfastPricePerNight: number;
  discountAmount: number;
  offerId?: string;
  specialRequests?: string;
  arrivalTime?: string;    // 'HH:MM'
  paymentMethod: string;   // 'pay_at_hotel' | 'online'
  source?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

export async function createBooking(client: Client, input: CreateBookingInput) {
  const db = client as any;
  const { data, error } = await db.rpc('create_booking_transaction', {
    p_guest_id: input.guestId,
    p_room_id: input.roomId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_adults: input.numAdults,
    p_num_children: input.numChildren,
    p_price_per_night: input.pricePerNight,
    p_breakfast_included: input.breakfastIncluded,
    p_breakfast_price_per_night: input.breakfastPricePerNight,
    p_discount_amount: input.discountAmount,
    p_offer_id: input.offerId ?? null,
    p_special_requests: input.specialRequests ?? null,
    p_arrival_time: input.arrivalTime ?? null,
    p_payment_method: input.paymentMethod,
    p_source: input.source ?? 'website',
  });
  if (error) return { data: null, error };

  // Also add primary guest record
  if (data?.success && data.booking_id) {
    await db.from('booking_guests').insert({
      booking_id: data.booking_id,
      full_name: input.guestName,
      email: input.guestEmail,
      phone: input.guestPhone,
      is_primary: true,
    });
  }
  return { data, error: data?.success ? null : new Error(data?.error ?? 'Booking failed') };
}

// ─── Fetch Bookings ───────────────────────────────────────────────────────────

const BOOKING_SELECT = `
  id, booking_reference, status, check_in, check_out, nights,
  num_adults, num_children, special_requests, internal_notes,
  arrival_time, subtotal, discount_amount, tax_amount, total_amount,
  paid_amount, balance_amount, payment_status, source,
  cancelled_at, cancellation_reason, confirmed_at, checked_in_at, checked_out_at,
  created_at, updated_at,
  profiles:guest_id(id, full_name, email, phone, avatar_url),
  booking_rooms(id, room_id, room_type_id, price_per_night, total_price, breakfast_included,
    rooms:room_id(id, room_number, floor, wing),
    room_types:room_type_id(id, name, bed_type)
  ),
  booking_guests(id, full_name, email, phone, is_primary),
  offers:offer_id(id, title, code),
  payments(id, method, status, amount, paid_at)
`;

export async function getBookingById(client: Client, id: string) {
  const db = client as any;
  return db.from('bookings').select(BOOKING_SELECT).eq('id', id).single();
}

export async function getBookingByReference(client: Client, ref: string) {
  const db = client as any;
  return db.from('bookings').select(BOOKING_SELECT).eq('booking_reference', ref).single();
}

export async function getBookingsByGuest(
  client: Client,
  guestId: string,
  options?: { page?: number; perPage?: number; status?: string }
) {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 10;
  const db = client as any;
  let query = db
    .from('bookings')
    .select(BOOKING_SELECT, { count: 'exact' })
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  if (options?.status) query = query.eq('status', options.status);
  return query;
}

export interface BookingFilters {
  status?: string;
  checkInFrom?: string;
  checkInTo?: string;
  guestSearch?: string;
  paymentStatus?: string;
  page?: number;
  perPage?: number;
}

export async function getAllBookings(client: Client, filters: BookingFilters = {}) {
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 25;
  const db = client as any;

  let query = db
    .from('bookings')
    .select(BOOKING_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters.checkInFrom) query = query.gte('check_in', filters.checkInFrom);
  if (filters.checkInTo) query = query.lte('check_in', filters.checkInTo);

  return query;
}

export async function getBookingCalendar(
  client: Client,
  startDate: string,
  endDate: string
) {
  const db = client as any;
  return db
    .from('bookings')
    .select(`
      id, booking_reference, status, check_in, check_out, num_adults,
      profiles:guest_id(full_name),
      booking_rooms(room_id, rooms:room_id(room_number, floor),
        room_types:room_type_id(name))
    `)
    .neq('status', 'cancelled')
    .or(`check_in.lte.${endDate},check_out.gte.${startDate}`)
    .order('check_in');
}

// ─── Status Transitions ────────────────────────────────────────────────────────

export async function confirmBooking(client: Client, bookingId: string) {
  const db = client as any;
  return db.from('bookings').update({
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  }).eq('id', bookingId).select().single();
}

export async function checkInBooking(client: Client, bookingId: string, roomId: string) {
  const db = client as any;
  // Update booking
  const result = await db.from('bookings').update({
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
  }).eq('id', bookingId).select().single();

  // Update room to occupied
  if (!result.error) {
    await db.from('rooms').update({ status: 'occupied' }).eq('id', roomId);
  }
  return result;
}

export async function checkOutBooking(client: Client, bookingId: string, roomId: string) {
  const db = client as any;
  // Update booking
  const result = await db.from('bookings').update({
    status: 'checked_out',
    checked_out_at: new Date().toISOString(),
  }).eq('id', bookingId).select().single();

  // Release room — mark dirty / available
  if (!result.error) {
    await db.from('rooms').update({
      status: 'available',
      cleaning_status: 'dirty',
    }).eq('id', roomId);

    // Fetch room number for notification
    const { data: room } = await db.from('rooms').select('room_number').eq('id', roomId).single();
    const roomLabel = room?.room_number ? `Room ${room.room_number}` : 'A room';

    // 🧹 Notify ALL housekeeping staff to clean the room
    await notifyRoleUsers(client, 'housekeeping', {
      type:      'staff_assignment',
      title:     `🧹 Room Ready to Clean`,
      body:      `${roomLabel} needs cleaning — guest has checked out.`,
      priority:  'high',
      actionUrl: '/admin/housekeeping',
      metadata:  { roomId, bookingId },
    });

    // 📋 Notify reception/manager/admin/super_admin of checkout
    await notifyStaffUsers(client, {
      type:      'booking_confirmed',
      title:     `✅ Guest Checked Out`,
      body:      `Guest checked out from ${roomLabel}. Room is now available.`,
      priority:  'normal',
      actionUrl: `/admin/bookings/${bookingId}`,
      metadata:  { roomId, bookingId },
    });
  }
  return result;
}

export async function cancelBooking(
  client: Client,
  bookingId: string,
  reason: string,
  cancelledBy?: string
) {
  const db = client as any;
  const result = await db.from('bookings').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
    cancelled_by: cancelledBy ?? null,
  }).eq('id', bookingId).select().single();

  // Free up the room
  if (!result.error && result.data) {
    const { data: br } = await db
      .from('booking_rooms')
      .select('room_id')
      .eq('booking_id', bookingId)
      .single();
    if (br?.room_id) {
      await db.from('rooms').update({ status: 'available' }).eq('id', br.room_id);
    }
  }
  return result;
}

export async function updateBookingNotes(client: Client, bookingId: string, notes: string) {
  const db = client as any;
  return db.from('bookings').update({ internal_notes: notes }).eq('id', bookingId);
}

export async function markNoShow(client: Client, bookingId: string) {
  const db = client as any;
  const result = await db.from('bookings').update({
    status: 'no_show',
  }).eq('id', bookingId).select().single();

  // Free up the room back to available
  if (!result.error) {
    const { data: br } = await db
      .from('booking_rooms')
      .select('room_id')
      .eq('booking_id', bookingId)
      .single();
    if (br?.room_id) {
      await db.from('rooms').update({ status: 'available' }).eq('id', br.room_id);
    }
    // Notify staff
    await notifyStaffUsers(client, {
      type:      'admin_alert',
      title:     `⚠️ No Show Recorded`,
      body:      `A booking has been marked as No Show.`,
      priority:  'high',
      actionUrl: `/admin/bookings/${bookingId}`,
      metadata:  { bookingId },
    });
  }
  return result;
}

export async function reassignRoom(client: Client, bookingId: string, newRoomId: string) {

  const db = client as any;
  // Check new room availability
  const { data: booking } = await db
    .from('bookings')
    .select('check_in, check_out')
    .eq('id', bookingId)
    .single();
  if (!booking) return { error: new Error('Booking not found') };

  const isAvailable = await checkRoomAvailability(
    client, newRoomId, booking.check_in, booking.check_out, bookingId
  );
  if (!isAvailable) return { error: new Error('New room is not available for those dates') };

  // Get room type
  const { data: room } = await db
    .from('rooms')
    .select('room_type_id, override_price, room_types(base_price)')
    .eq('id', newRoomId)
    .single();

  await db.from('booking_rooms').update({ room_id: newRoomId, room_type_id: room.room_type_id })
    .eq('booking_id', bookingId);
  return { error: null };
}

// ─── Admin Manual Booking ──────────────────────────────────────────────────────

export interface AdminCreateBookingInput extends CreateBookingInput {
  internalNotes?: string;
}

export async function createAdminBooking(client: Client, input: AdminCreateBookingInput) {
  return createBooking(client, { ...input, source: 'reception' });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getBookingStats(client: Client) {
  const today = new Date().toISOString().split('T')[0];
  const db = client as any;
  const { data } = await db.from('bookings').select('status, check_in, check_out, total_amount');
  if (!data) return null;
  return {
    total: data.length,
    pending: data.filter((b: any) => b.status === 'pending').length,
    confirmed: data.filter((b: any) => b.status === 'confirmed').length,
    checkedIn: data.filter((b: any) => b.status === 'checked_in').length,
    todayCheckins: data.filter((b: any) => b.check_in === today && b.status === 'confirmed').length,
    todayCheckouts: data.filter((b: any) => b.check_out === today && b.status === 'checked_in').length,
    revenue: data.filter((b: any) => !['cancelled', 'pending'].includes(b.status))
      .reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0),
  };
}
