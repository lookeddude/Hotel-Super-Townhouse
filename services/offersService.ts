/**
 * services/offersService.ts — corrected to match DB schema
 * DB columns: id, title, slug, description, short_description, code, discount_type,
 *             discount_value, min_nights, min_booking_amount, max_discount_amount,
 *             applicable_room_types, valid_from, valid_until, usage_limit, used_count,
 *             thumbnail_url, is_featured, is_active, created_at, updated_at
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

export async function getOffers(client: Client, activeOnly = false) {
  let query = client.from('offers').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  return query;
}

export async function getOfferById(client: Client, id: string) {
  return client.from('offers').select('*').eq('id', id).single();
}

export async function createOffer(client: Client, data: Record<string, any>) {
  return client.from('offers').insert(data).select().single();
}

export async function updateOffer(client: Client, id: string, data: Record<string, any>) {
  return client.from('offers').update(data).eq('id', id).select().single();
}

export async function deleteOffer(client: Client, id: string) {
  return client.from('offers').delete().eq('id', id);
}

export async function validateCoupon(client: Client, code: string) {
  const today = new Date().toISOString().split('T')[0];
  return client
    .from('offers')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .lte('valid_from', today)
    .gte('valid_until', today)
    .maybeSingle();
}
