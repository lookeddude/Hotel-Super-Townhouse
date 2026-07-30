import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { createServerClient } from '@/lib/supabase/server';
import { GalleryGrid } from '@/features/gallery/GalleryGrid';

export const metadata: Metadata = createMetadata({
  title: 'Gallery',
  description: 'Explore our gallery of rooms, dining, lobby, and facilities at Super Townhouse, Whitefield Bengaluru.',
});

export default async function GalleryPage() {
  let galleryItems: any[] = [];
  let categories: string[] = ['All'];

  try {
    const supabase = await createServerClient();
    const { data } = await (supabase as any)
      .from('gallery')
      .select('id, title, storage_path, alt_text, category, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data && data.length > 0) {
      // Build public URLs from storage paths
      galleryItems = data.map((item: any) => {
        let publicUrl = '';
        if (item.storage_path) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          publicUrl = `${supabaseUrl}/storage/v1/object/public/hotel-images/${item.storage_path}`;
        }
        return { ...item, public_url: publicUrl };
      });

      // Extract unique categories
      const uniqueCats = [...new Set<string>(data.map((i: any) => i.category).filter(Boolean))] as string[];
      categories = ['All', ...uniqueCats.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1))];
    }
  } catch {
    // Fall back to empty
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Gallery</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            A visual tour of Super Townhouse — rooms, dining, and facilities
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <GalleryGrid items={galleryItems} categories={categories} />
      </div>
    </div>
  );
}
