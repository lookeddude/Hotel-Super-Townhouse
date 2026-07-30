/**
 * services/galleryService.ts — corrected to match DB schema
 * DB columns: id, title, description, storage_path, alt_text, category,
 *             tags, width, height, file_size, mime_type, display_order,
 *             is_featured, is_active, created_at, updated_at
 * Note: image_url is derived from storage_path via getPublicUrl
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any>;

const BUCKET = 'hotel-images';

export function getPublicUrl(client: Client, storagePath: string): string {
  const { data } = client.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getGallery(client: Client, category?: string, activeOnly = false) {
  let query = client
    .from('gallery')
    .select('*')
    .order('display_order', { ascending: true });

  if (category) query = query.eq('category', category);
  if (activeOnly) query = query.eq('is_active', true);

  const result = await query;
  if (result.data) {
    // Augment with public_url
    result.data = result.data.map((item: any) => ({
      ...item,
      public_url: item.storage_path ? getPublicUrl(client, item.storage_path) : null,
    }));
  }
  return result;
}

export async function createGalleryItem(
  client: Client,
  data: {
    title: string;
    storage_path: string;
    alt_text?: string;
    category?: string;
    display_order?: number;
    is_active?: boolean;
    file_size?: number;
    mime_type?: string;
  }
) {
  return client.from('gallery').insert(data).select().single();
}

export async function updateGalleryItem(client: Client, id: string, data: Record<string, any>) {
  return client.from('gallery').update(data).eq('id', id).select().single();
}

export async function deleteGalleryItem(client: Client, id: string) {
  return client.from('gallery').delete().eq('id', id);
}

export async function reorderGallery(
  client: Client,
  items: { id: string; display_order: number }[]
) {
  return Promise.all(
    items.map(({ id, display_order }) =>
      client.from('gallery').update({ display_order }).eq('id', id)
    )
  );
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function uploadToStorage(
  client: Client,
  path: string,
  file: File
): Promise<{ url: string | null; storagePath: string | null; error: any }> {
  const { data, error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error || !data) return { url: null, storagePath: null, error };

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, storagePath: data.path, error: null };
}

export async function deleteFromStorage(client: Client, storagePath: string) {
  return client.storage.from(BUCKET).remove([storagePath]);
}

export async function listStorageFiles(client: Client, folder = '') {
  return client.storage.from(BUCKET).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });
}
