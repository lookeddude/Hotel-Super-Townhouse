/**
 * app/sitemap.ts
 * Dynamic sitemap generation for Next.js App Router
 * Adds dynamic room pages from Supabase
 */
import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://supertownhouse.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                      lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/rooms`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/book`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/gallery`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/about`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/facilities`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/policies`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Dynamic room pages
  try {
    const supabase = await createServerClient();
    const { data: rooms } = await supabase
      .from('room_types')
      .select('id, updated_at')
      .eq('is_active', true);

    const roomPages: MetadataRoute.Sitemap = (rooms ?? []).map((room) => ({
      url:             `${BASE_URL}/rooms/${room.id}`,
      lastModified:    new Date(room.updated_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    return [...staticPages, ...roomPages];
  } catch {
    // Return static pages only if DB is unreachable during build
    return staticPages;
  }
}
