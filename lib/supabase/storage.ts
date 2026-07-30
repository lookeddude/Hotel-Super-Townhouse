/**
 * Supabase Storage Helpers
 * ─────────────────────────
 * Typed, reusable utility functions for all storage operations.
 * Prepared for Phase 3 — not yet wired to business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseConfig } from './config';

const { storage } = supabaseConfig;

type Client = SupabaseClient<Database>;

// ─── Public URL helpers ──────────────────────────────────────────────────────

/**
 * Get a public URL for a file in a public bucket.
 */
export function getPublicUrl(
  client: Client,
  bucket: string,
  path: string
): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a signed URL for a file in a private bucket.
 */
export async function getSignedUrl(
  client: Client,
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error('[Storage] getSignedUrl error:', error.message);
    return null;
  }
  return data.signedUrl;
}

// ─── Room Images ─────────────────────────────────────────────────────────────

export function getRoomImageUrl(client: Client, path: string): string {
  return getPublicUrl(client, storage.roomImages, path);
}

export function buildRoomImagePath(roomId: string, fileName: string): string {
  return `rooms/${roomId}/${fileName}`;
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function getGalleryImageUrl(client: Client, path: string): string {
  return getPublicUrl(client, storage.gallery, path);
}

// ─── Hotel Assets ─────────────────────────────────────────────────────────────

export function getHotelAssetUrl(client: Client, path: string): string {
  return getPublicUrl(client, storage.hotelAssets, path);
}

// ─── Profile Images ──────────────────────────────────────────────────────────

export async function getProfileImageUrl(
  client: Client,
  userId: string,
  fileName: string
): Promise<string | null> {
  const path = `users/${userId}/${fileName}`;
  return getSignedUrl(client, storage.profileImages, path);
}

// ─── Invoice Files ───────────────────────────────────────────────────────────

export async function getInvoiceUrl(
  client: Client,
  bookingId: string,
  fileName: string
): Promise<string | null> {
  const path = `bookings/${bookingId}/${fileName}`;
  return getSignedUrl(client, storage.invoiceFiles, path, 900); // 15 min
}

// ─── File path builders ───────────────────────────────────────────────────────

export const storagePaths = {
  roomImage: (roomId: string, file: string) => `rooms/${roomId}/${file}`,
  galleryImage: (category: string, file: string) => `${category}/${file}`,
  hotelAsset: (type: string, file: string) => `${type}/${file}`,
  profileImage: (userId: string, file: string) => `users/${userId}/${file}`,
  document: (entityId: string, file: string) => `${entityId}/${file}`,
  invoice: (bookingId: string, file: string) => `bookings/${bookingId}/${file}`,
} as const;
