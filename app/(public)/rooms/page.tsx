import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { createServerClient } from '@/lib/supabase/server';
import { RoomsGrid } from '@/components/rooms/RoomsGrid';
import { BedDouble } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Always fetch fresh data, no cache

export const metadata: Metadata = createMetadata({
  title: 'Rooms & Suites',
  description: 'Browse all rooms and suites at Super Townhouse, Whitefield Bengaluru.',
});

export default async function RoomsPage() {
  let roomTypes: any[] = [];

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('room_types')
      .select('id, name, slug, description, short_description, base_price, max_occupancy, size_sqft, bed_type, view_type, breakfast_included, thumbnail_url, image_url, images, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      roomTypes = data.map((r: any) => ({
        ...r,
        // Use thumbnail_url first, then image_url, then first item from images array
        coverUrl: r.thumbnail_url || r.image_url || (Array.isArray(r.images) && r.images[0]) || null,
      }));
    }
  } catch (err) {
    console.error('Rooms page error:', err);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">Rooms &amp; Suites</h1>
          <p className="text-gray-500 mt-2 text-base">
            Choose from our selection of thoughtfully designed rooms at Super Townhouse, Whitefield Bengaluru
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        {roomTypes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-24 text-center shadow-sm">
            <BedDouble size={56} className="mx-auto text-gray-300 mb-4" />
            <p className="font-heading font-semibold text-gray-800 text-lg mb-2">No Rooms Available</p>
            <p className="text-gray-500 text-sm mb-6">Please check back shortly.</p>
            <Link href="/" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              Back to Home
            </Link>
          </div>
        ) : (
          <RoomsGrid rooms={roomTypes} />
        )}
      </div>
    </div>
  );
}
