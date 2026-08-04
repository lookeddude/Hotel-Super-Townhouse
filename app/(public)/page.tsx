import type { Metadata } from 'next';
import { HeroSection } from '@/features/home/HeroSection';
import { AmenitiesSection } from '@/features/home/AmenitiesSection';
import { createMetadata } from '@/lib/metadata';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, Users, Maximize2, Star } from 'lucide-react';

export const metadata: Metadata = createMetadata({
  title: 'Super Townhouse — Premium Hotel in Whitefield, Bengaluru',
  description:
    'Book a premium stay at Super Townhouse, Whitefield ITPL Bengaluru. Modern rooms, world-class amenities, and impeccable hospitality await you.',
});

// Always fetch fresh data — reflects admin changes instantly
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredRooms: any[] = [];
  let approvedReviews: any[] = [];

  try {
    const supabase = await createServerClient();
    const db = supabase as any;

    // Fetch featured room types — include image_url which is set by admin panel
    const { data: rooms } = await db
      .from('room_types')
      .select('id, name, slug, short_description, base_price, max_occupancy, size_sqft, bed_type, image_url, thumbnail_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(3);

    if (rooms && rooms.length > 0) {
      // Also fetch from room_images table as fallback
      const roomIds = rooms.map((r: any) => r.id);
      const { data: images } = await db
        .from('room_images')
        .select('room_type_id, storage_path, alt_text, is_primary')
        .in('room_type_id', roomIds);

      // Merge: admin-uploaded image_url takes priority
      featuredRooms = rooms.map((r: any) => ({
        ...r,
        room_images: (images ?? []).filter((img: any) => img.room_type_id === r.id),
      }));
    }

    // Fetch 3 approved reviews
    const { data: reviews } = await db
      .from('reviews')
      .select('id, title, comment, overall_rating, created_at, profiles:guest_id(full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);
    approvedReviews = reviews ?? [];
  } catch {
    // Silently fall back
  }

  return (
    <>
      <HeroSection />
      <AmenitiesSection />

      {/* Featured Rooms — Live Data */}
      <section className="section-gap bg-background" aria-labelledby="featured-rooms-heading">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-label-md text-primary uppercase tracking-widest mb-3">Our Rooms</p>
            <h2 id="featured-rooms-heading" className="font-heading text-headline-lg text-on-surface mb-4">
              Rooms &amp; Suites
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
              From cozy standard rooms to spacious suites — every room is designed for your comfort.
            </p>
          </div>

          {featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room) => (
                <div key={room.id} className="card-base bg-white overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Room Image — uses image_url (admin-uploaded) first, then room_images table */}
                  <div className="h-48 relative overflow-hidden bg-gradient-to-br from-surface to-outline-variant">
                    {(() => {
                      // Priority 1: image_url set by admin panel
                      const primaryUrl = room.image_url || room.thumbnail_url;
                      // Priority 2: room_images table entry
                      const imgs: any[] = room.room_images ?? [];
                      const imgRecord = imgs.find((i: any) => i.is_primary) ?? imgs[0];
                      const finalSrc = primaryUrl || imgRecord?.storage_path;
                      return finalSrc ? (
                        <Image
                          src={finalSrc}
                          alt={room.name}
                          fill
                          unoptimized={finalSrc.startsWith('http')}
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BedDouble size={40} className="text-outline group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-heading font-semibold text-lg text-on-surface">{room.name}</h3>
                    {room.short_description && (
                      <p className="text-sm text-on-surface-variant line-clamp-2">{room.short_description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      {room.max_occupancy && <span className="flex items-center gap-1"><Users size={12} />{room.max_occupancy} guests</span>}
                      {room.size_sqft && <span className="flex items-center gap-1"><Maximize2 size={12} />{room.size_sqft} sq ft</span>}
                      {room.bed_type && <span className="capitalize flex items-center gap-1"><BedDouble size={12} />{room.bed_type}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                      <div>
                        <span className="font-heading font-bold text-xl text-primary">
                          ₹{Number(room.base_price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-on-surface-variant">/night</span>
                      </div>
                      <Link
                        href={`/rooms/${room.slug || room.id}`}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-base bg-white h-80 flex items-center justify-center text-on-surface-variant text-sm animate-pulse">
                  <BedDouble size={32} className="opacity-30" />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/rooms" className="inline-block px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors">
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Guest Reviews — Live Data */}
      <section className="section-gap bg-surface" aria-labelledby="testimonials-heading">
        <div className="container-custom text-center">
          <p className="text-label-md text-primary uppercase tracking-widest mb-3">Guest Experiences</p>
          <h2 id="testimonials-heading" className="font-heading text-headline-lg text-on-surface mb-4">
            What Our Guests Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {approvedReviews.length > 0 ? approvedReviews.map((review) => {
              const guestName = Array.isArray(review.profiles) ? review.profiles[0]?.full_name : review.profiles?.full_name;
              return (
                <div key={review.id} className="bg-white p-6 rounded-xl border border-outline-variant space-y-3 text-left hover:shadow-sm transition-shadow">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} className={s < (review.overall_rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'} />
                    ))}
                  </div>
                  {review.title && <p className="font-semibold text-sm text-on-surface">{review.title}</p>}
                  <p className="text-on-surface-variant text-sm italic leading-relaxed line-clamp-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <p className="text-xs text-primary font-semibold pt-1">— {guestName ?? 'Verified Guest'}</p>
                </div>
              );
            }) : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-outline-variant space-y-3 text-left">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} className="text-primary text-sm">★</span>
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm italic leading-relaxed">
                  &ldquo;Excellent stay! Very clean, well-maintained, and the staff was incredibly helpful.&rdquo;
                </p>
                <p className="text-xs text-primary font-semibold">— Verified Guest</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
