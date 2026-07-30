/**
 * services/roomService.ts — Phase 5 (corrected to match actual DB schema)
 * 
 * rooms columns: id, room_number, room_type_id, floor, wing, description, status,
 *                cleaning_status, is_available, is_featured, override_price,
 *                override_weekend_price, notes, last_cleaned_at, last_maintained_at,
 *                created_at, updated_at, deleted_at
 *
 * room_types columns: id, name, slug, description, short_description, base_price,
 *                     weekend_price, holiday_price, max_occupancy, max_adults,
 *                     max_children, size_sqft, bed_type, view_type, breakfast_included,
 *                     breakfast_price, extra_bed_available, extra_bed_price,
 *                     cancellation_policy, display_order
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

// ─── Room Types ───────────────────────────────────────────────────────────────

export async function getRoomTypes(client: Client) {
  return client
    .from('room_types')
    .select('*')
    .order('display_order', { ascending: true });
}

export async function getRoomTypeById(client: Client, id: string) {
  return client.from('room_types').select('*').eq('id', id).single();
}

export async function createRoomType(client: Client, data: Record<string, any>) {
  return client.from('room_types').insert(data).select().single();
}

export async function updateRoomType(client: Client, id: string, data: Record<string, any>) {
  return client.from('room_types').update(data).eq('id', id).select().single();
}

export async function deleteRoomType(client: Client, id: string) {
  return client.from('room_types').delete().eq('id', id);
}

// ─── Amenities ────────────────────────────────────────────────────────────────

export async function getAmenities(client: Client) {
  return client
    .from('amenities')
    .select('*')
    .order('display_order', { ascending: true });
}

export async function createAmenity(client: Client, data: Record<string, any>) {
  return client.from('amenities').insert(data).select().single();
}

export async function updateAmenity(client: Client, id: string, data: Record<string, any>) {
  return client.from('amenities').update(data).eq('id', id).select().single();
}

export async function deleteAmenity(client: Client, id: string) {
  return client.from('amenities').delete().eq('id', id);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function getRooms(
  client: Client,
  options?: {
    status?: string;
    roomTypeId?: string;
    page?: number;
    perPage?: number;
    search?: string;
  }
) {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 50;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = client
    .from('rooms')
    .select(
      `*, room_types(id, name, slug, base_price, max_occupancy, bed_type)`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('room_number', { ascending: true })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);
  if (options?.roomTypeId) query = query.eq('room_type_id', options.roomTypeId);
  if (options?.search) query = query.ilike('room_number', `%${options.search}%`);

  return query;
}

export async function getRoomById(client: Client, id: string) {
  return client
    .from('rooms')
    .select(`*, room_types(*), room_images(*), room_amenities(*, amenities(*))`)
    .eq('id', id)
    .single();
}

export async function createRoom(client: Client, data: Record<string, any>) {
  return client.from('rooms').insert(data).select().single();
}

export async function updateRoom(client: Client, id: string, data: Record<string, any>) {
  return client.from('rooms').update(data).eq('id', id).select().single();
}

export async function deleteRoom(client: Client, id: string) {
  return client.from('rooms').update({ deleted_at: new Date().toISOString() }).eq('id', id);
}

export async function getRoomStats(client: Client) {
  const { data, error } = await client
    .from('rooms')
    .select('status')
    .is('deleted_at', null);

  if (error || !data) return { total: 0, available: 0, occupied: 0, maintenance: 0 };

  return data.reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === 'available') acc.available++;
      else if (r.status === 'occupied') acc.occupied++;
      else if (r.status === 'maintenance') acc.maintenance++;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, maintenance: 0 }
  );
}

// ─── Room Images ──────────────────────────────────────────────────────────────

export async function addRoomImage(client: Client, data: Record<string, any>) {
  return client.from('room_images').insert(data).select().single();
}

export async function deleteRoomImage(client: Client, id: string) {
  return client.from('room_images').delete().eq('id', id);
}
