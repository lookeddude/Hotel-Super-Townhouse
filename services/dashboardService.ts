/**
 * services/dashboardService.ts — corrected to match DB schema
 *
 * bookings columns: id, booking_reference, guest_id, offer_id, status,
 *   check_in, check_out, nights, num_adults, num_children, subtotal,
 *   discount_amount, tax_amount, total_amount, paid_amount, balance_amount,
 *   currency, payment_status, ...
 *
 * reviews: no guest_name column — use profiles join on guest_id
 * contact_messages: full_name (not name), is_replied (not is_resolved)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalBookings: number;
  pendingBookings: number;
  todayCheckins: number;
  todayCheckouts: number;
  pendingContacts: number;
  pendingReviews: number;
  avgRating: number;
}

export async function getDashboardStats(client: Client): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  const [roomsResult, bookingsResult, todayCheckinsResult, todayCheckoutsResult, contactsResult, reviewsResult] =
    await Promise.allSettled([
      client.from('rooms').select('status').is('deleted_at', null),
      client.from('bookings').select('status').neq('status', 'cancelled'),
      client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('check_in', today)
        .eq('status', 'confirmed'),
      client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('check_out', today)
        .eq('status', 'checked_in'),
      client
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_replied', false),
      client.from('reviews').select('overall_rating, status'),
    ]);

  const roomData = roomsResult.status === 'fulfilled' ? (roomsResult.value.data ?? []) : [];
  const totalRooms = roomData.length;
  const availableRooms = roomData.filter((r) => r.status === 'available').length;
  const occupiedRooms = roomData.filter((r) => r.status === 'occupied').length;
  const maintenanceRooms = roomData.filter((r) => r.status === 'maintenance').length;

  const bookingData = bookingsResult.status === 'fulfilled' ? (bookingsResult.value.data ?? []) : [];
  const totalBookings = bookingData.length;
  const pendingBookings = bookingData.filter((b) => b.status === 'pending').length;

  const todayCheckins = todayCheckinsResult.status === 'fulfilled' ? (todayCheckinsResult.value.count ?? 0) : 0;
  const todayCheckouts = todayCheckoutsResult.status === 'fulfilled' ? (todayCheckoutsResult.value.count ?? 0) : 0;
  const pendingContacts = contactsResult.status === 'fulfilled' ? (contactsResult.value.count ?? 0) : 0;

  const reviewData = reviewsResult.status === 'fulfilled' ? (reviewsResult.value.data ?? []) : [];
  const pendingReviews = reviewData.filter((r) => r.status === 'pending').length;
  const approvedReviews = reviewData.filter((r) => r.status === 'approved');
  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + (r.overall_rating ?? 0), 0) / approvedReviews.length
      : 0;

  return {
    totalRooms, availableRooms, occupiedRooms, maintenanceRooms,
    totalBookings, pendingBookings, todayCheckins, todayCheckouts,
    pendingContacts, pendingReviews,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

export async function getRecentBookings(client: Client, limit = 5) {
  // Use check_in/check_out (not check_in_date/check_out_date), join profiles for guest name
  return client
    .from('bookings')
    .select(`
      id,
      booking_reference,
      check_in,
      check_out,
      status,
      total_amount,
      payment_status,
      created_at,
      profiles:guest_id(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getRecentReviews(client: Client, limit = 5) {
  return client
    .from('reviews')
    .select(`
      id,
      overall_rating,
      title,
      comment,
      status,
      created_at,
      profiles:guest_id(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getRecentContacts(client: Client, limit = 5) {
  return client
    .from('contact_messages')
    .select('id, full_name, email, subject, is_replied, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
}
