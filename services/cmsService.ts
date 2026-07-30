/**
 * services/cmsService.ts — Phase 5 (corrected to match DB schema)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

// ─── Hotel Information ────────────────────────────────────────────────────────

export async function getHotelInfo(client: Client) {
  const { data, error } = await client
    .from('hotel_information')
    .select('*')
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function updateHotelInfo(client: Client, id: string, updates: Record<string, any>) {
  const { data, error } = await client
    .from('hotel_information')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// ─── Hotel Policies ────────────────────────────────────────────────────────────

export async function getHotelPolicies(client: Client) {
  const { data, error } = await client
    .from('hotel_policies')
    .select('*')
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function upsertHotelPolicies(client: Client, policies: Record<string, any>) {
  const { data, error } = await client
    .from('hotel_policies')
    .upsert(policies)
    .select()
    .single();
  return { data, error };
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
// DB columns: id, question, answer, category, display_order, is_featured, is_active

export async function getFAQs(client: Client, activeOnly = false) {
  let query = client.from('faq').select('*').order('display_order', { ascending: true });
  if (activeOnly) query = query.eq('is_active', true);
  return query;
}

export async function createFAQ(client: Client, faq: {
  question: string;
  answer: string;
  display_order?: number;
  is_active?: boolean;
  category?: string;
}) {
  return client.from('faq').insert(faq).select().single();
}

export async function updateFAQ(client: Client, id: string, updates: Record<string, any>) {
  return client.from('faq').update(updates).eq('id', id).select().single();
}

export async function deleteFAQ(client: Client, id: string) {
  return client.from('faq').delete().eq('id', id);
}

// ─── Settings ────────────────────────────────────────────────────────────────
// DB columns: id, key, value, description, is_public, group_name

export async function getAllSettings(client: Client) {
  const { data, error } = await client.from('settings').select('*').order('key');
  return { data, error };
}

export async function getSetting(client: Client, key: string) {
  const { data, error } = await client
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  return { data: data?.value, error };
}

export async function upsertSetting(client: Client, key: string, value: string, description?: string) {
  const payload: Record<string, any> = { key, value };
  if (description) payload.description = description;
  const { data, error } = await client.from('settings').upsert(payload, { onConflict: 'key' }).select().single();
  return { data, error };
}

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
// DB columns: id, page_path, title, description, keywords, og_title, og_description, og_image_url, canonical_url, robots, structured_data

export async function getSEOForPage(client: Client, pagePath: string) {
  const { data, error } = await client
    .from('seo_metadata')
    .select('*')
    .eq('page_path', pagePath)
    .maybeSingle();
  return { data, error };
}

export async function getAllSEO(client: Client) {
  const { data, error } = await client.from('seo_metadata').select('*').order('page_path');
  return { data, error };
}

export async function upsertSEO(client: Client, seo: Record<string, any>) {
  const { data, error } = await client
    .from('seo_metadata')
    .upsert(seo, { onConflict: 'page_path' })
    .select()
    .single();
  return { data, error };
}

// ─── Homepage Content ─────────────────────────────────────────────────────────

export async function getHomepageContent(client: Client) {
  const { data, error } = await client.from('homepage_content').select('*').order('section');
  return { data, error };
}

export async function upsertHomepageSection(client: Client, section: Record<string, any>) {
  const { data, error } = await client
    .from('homepage_content')
    .upsert(section, { onConflict: 'section' })
    .select()
    .single();
  return { data, error };
}
