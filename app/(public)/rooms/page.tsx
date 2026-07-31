import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BedDouble, Users, Maximize2, Star } from 'lucide-react';

export const metadata: Metadata = createMetadata({
  title: 'Rooms & Suites',
  description: 'Browse all rooms and suites at Super Townhouse, Whitefield Bengaluru. Filter by type, price, and amenities.',
});

export const revalidate = 60;

export default async function RoomsPage() {
  let roomTypes: any[] = [];
  let categories: string[] = [];

  try {
    const supabase = await createServerClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const { data } = await (supabase as any)
      .from('room_types')
      .select(`
        id, name, slug, description, short_description,
        base_price, weekend_price, max_occupancy, max_adults, max_children,
        size_sqft, bed_type, view_type, breakfast_included,
        image_url, images,
        display_order,
        room_images (storage_path, alt_text, is_primary, display_order)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (data) {
      // Build public image URL for each room type
      roomTypes = data.map((r: any) => {
        // Priority: room_images table → images JSONB array → image_url column
        const fromTable = (r.room_images ?? [])
          .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
          .map((img: any) => img.storage_path
            ? `${supabaseUrl}/storage/v1/object/public/hotel-images/${img.storage_path}`
            : null
          ).filter(Boolean);
        const fromImages = (r.images ?? []).filter(Boolean);
        const coverUrl = fromTable[0] || fromImages[0] || r.image_url || null;
        return { ...r, coverUrl };
      });
      categories = [...new Set<string>(data.map((r: any) => r.bed_type).filter(Boolean))] as string[];
    }
  } catch {
    // Silently fall back
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Rooms &amp; Suites</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Choose from our selection of thoughtfully designed rooms at Super Townhouse, Whitefield
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0" aria-label="Room filters">
            <div className="bg-white rounded-lg border border-outline-variant p-5 space-y-5 sticky top-24">
              <h2 className="font-heading font-semibold text-base text-on-surface">Filter Rooms</h2>

              {/* Price range */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface text-sm font-medium">Price Range (₹/night)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary" aria-label="Minimum price" />
                  <input type="number" placeholder="Max" className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary" aria-label="Maximum price" />
                </div>
              </div>

              {/* Bed type */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface">Bed Type</label>
                  {categories.map((type) => (
                    <label key={type} className="flex items-center gap-2.5 cursor-pointer capitalize">
                      <input type="checkbox" className="accent-primary w-4 h-4" />
                      <span className="text-sm text-on-surface-variant">{type}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Guests */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface" htmlFor="guests-select">Guests</label>
                <select id="guests-select" className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-white">
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3 Guests</option>
                  <option>4+ Guests</option>
                </select>
              </div>

              <button className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Room listing */}
          <main className="flex-1" id="rooms-grid" aria-label="Room listing">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-on-surface-variant">
                Showing <strong className="text-on-surface">{roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''}</strong>
              </p>
              <select className="px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none bg-white" aria-label="Sort rooms by">
                <option>Sort: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            {roomTypes.length === 0 ? (
              <div className="bg-white rounded-lg border border-outline-variant py-24 text-center">
                <BedDouble size={48} className="mx-auto text-outline-variant mb-4" />
                <p className="font-heading font-semibold text-on-surface mb-2">Rooms Coming Soon</p>
                <p className="text-sm text-on-surface-variant mb-6">We&apos;re updating our room inventory. Please check back shortly.</p>
                <Link href="/" className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
                  Back to Home
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {roomTypes.map((room: any) => (
                  <div key={room.id} className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* Room Image */}
                      <div className="w-full md:w-72 h-48 md:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-surface to-outline-variant">
                        {room.coverUrl ? (
                          <img
                            src={room.coverUrl}
                            alt={room.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.img-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="img-fallback w-full h-full flex items-center justify-center"
                          style={{ display: room.coverUrl ? 'none' : 'flex' }}
                        >
                          <BedDouble size={48} className="text-outline" />
                        </div>
                        {room.breakfast_included && (
                          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            Breakfast Included
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h2 className="font-heading font-semibold text-lg text-on-surface">{room.name}</h2>
                            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                              {room.short_description || room.description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-heading font-bold text-xl text-primary">
                              ₹{Number(room.base_price || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-on-surface-variant">per night</p>
                          </div>
                        </div>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-4 mt-4">
                          {room.max_occupancy && (
                            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                              <Users size={15} className="text-primary" />
                              <span>Up to {room.max_occupancy} guests</span>
                            </div>
                          )}
                          {room.size_sqft && (
                            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                              <Maximize2 size={15} className="text-primary" />
                              <span>{room.size_sqft} sq ft</span>
                            </div>
                          )}
                          {room.bed_type && (
                            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                              <BedDouble size={15} className="text-primary" />
                              <span className="capitalize">{room.bed_type}</span>
                            </div>
                          )}
                          {room.view_type && (
                            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                              <Star size={15} className="text-primary" />
                              <span className="capitalize">{room.view_type} view</span>
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-outline-variant">
                          <Link
                            href={`/rooms/${room.id}`}
                            className="flex-1 text-center py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            View Details &amp; Book
                          </Link>
                          <Link
                            href={`/rooms/${room.id}`}
                            className="px-4 py-2.5 border border-outline-variant text-sm text-on-surface rounded-lg hover:bg-surface transition-colors"
                          >
                            More Info
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
