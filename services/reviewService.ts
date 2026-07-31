/**
 * services/reviewService.ts — corrected to match DB schema
 * DB columns: id, booking_id, guest_id, room_id, room_type_id, overall_rating,
 *             cleanliness_rating, service_rating, location_rating, value_rating,
 *             comfort_rating, title, comment, images, is_verified_guest, status,
 *             admin_reply, admin_replied_at, admin_replied_by, helpful_count,
 *             created_at, updated_at
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

export interface ReviewSubmission {
  room_type_id: string;
  booking_id?:  string;
  overall_rating: number;
  cleanliness_rating?: number;
  service_rating?: number;
  value_rating?: number;
  title?: string;
  comment: string;
}

/** Guest submits a new review */
export async function submitReview(client: Client, data: ReviewSubmission) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: { message: 'You must be logged in to leave a review.' } };
  return client.from('reviews').insert({
    ...data,
    guest_id: user.id,
    status: 'pending',
  }).select().single();
}

/** Fetch approved reviews for a specific room type (public) */
export async function getRoomReviews(client: Client, roomTypeId: string) {
  return client
    .from('reviews')
    .select(`
      id, overall_rating, cleanliness_rating, service_rating, value_rating,
      title, comment, admin_reply, admin_replied_at, created_at, is_verified_guest,
      profiles:guest_id(full_name, avatar_url)
    `)
    .eq('room_type_id', roomTypeId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);
}

export async function getReviews(
  client: Client,
  options?: { status?: string; page?: number; perPage?: number }
) {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = client
    .from('reviews')
    .select(`
      *,
      profiles:guest_id(full_name, email, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  return query;
}

export async function updateReviewStatus(client: Client, id: string, status: string) {
  return client.from('reviews').update({ status }).eq('id', id).select().single();
}

export async function addAdminReply(client: Client, id: string, reply: string) {
  return client
    .from('reviews')
    .update({
      admin_reply: reply,
      admin_replied_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteReview(client: Client, id: string) {
  return client.from('reviews').delete().eq('id', id);
}

export async function getReviewStats(client: Client) {
  const { data, error } = await client
    .from('reviews')
    .select('status, overall_rating');

  if (error || !data) return { pending: 0, approved: 0, rejected: 0, avg: 0 };

  const pending = data.filter((r) => r.status === 'pending').length;
  const approved = data.filter((r) => r.status === 'approved').length;
  const rejected = data.filter((r) => r.status === 'rejected').length;
  const approvedRatings = data.filter((r) => r.status === 'approved' && r.overall_rating);
  const avg =
    approvedRatings.length > 0
      ? approvedRatings.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / approvedRatings.length
      : 0;
  return { pending, approved, rejected, avg: Math.round(avg * 10) / 10 };
}
