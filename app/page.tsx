import type { Metadata } from 'next';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { HeroSection } from '@/features/home/HeroSection';
import { AmenitiesSection } from '@/features/home/AmenitiesSection';
import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/constants/routes';
import { createServerClient } from '@/lib/supabase/server';
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

    // Fetch featured room types — include image_url set by admin panel
    const { data: rooms } = await db
      .from('room_types')
      .select('id, name, slug, short_description, base_price, max_occupancy, size_sqft, bed_type, image_url, thumbnail_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(3);

    if (rooms && rooms.length > 0) {
      // Also fetch room_images table as fallback
      const roomIds = rooms.map((r: any) => r.id);
      const { data: images } = await db
        .from('room_images')
        .select('room_type_id, storage_path, alt_text, is_primary')
        .in('room_type_id', roomIds);

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
    // Silently fall back to empty arrays
  }

  // Hardcoded fallback testimonials (shown only when no approved reviews exist)
  const fallbackReviews = [
    { name: 'Arjun Mehta',  rating: 5, text: 'Excellent stay! Very clean, well-maintained, and the staff was incredibly helpful. Perfect for my business trip to Whitefield.' },
    { name: 'Priya Sharma', rating: 5, text: 'The rooms are spacious and the Wi-Fi is super fast. Great location near ITPL. Will definitely book again!' },
    { name: 'Rahul Nair',   rating: 4, text: 'Good value for money. The restaurant food was amazing. Checkout was smooth and staff was very courteous.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="flex-1">

        {/* Hero */}
        <HeroSection />

        {/* Amenities */}
        <AmenitiesSection />

        {/* Featured Rooms — Live from DB */}
        <section className="section-gap bg-background" aria-labelledby="featured-rooms-heading">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="text-label-md text-primary uppercase tracking-widest mb-3 font-semibold">Our Rooms</p>
              <h2 id="featured-rooms-heading" className="font-heading text-headline-lg text-on-surface mb-6 section-heading-accent">
                Rooms &amp; Suites
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto mt-4">
                From cozy standard rooms to spacious suites — every room is designed for your comfort.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.length > 0 ? featuredRooms.map((room) => {
                // Priority 1: image_url from admin panel upload
                const primaryUrl = room.image_url || room.thumbnail_url;
                // Priority 2: room_images table
                const imgs: any[] = room.room_images ?? [];
                const imgRecord = imgs.find((i: any) => i.is_primary) ?? imgs[0];
                const finalSrc = primaryUrl || imgRecord?.storage_path;

                return (
                  <div key={room.id} className="card-base bg-white overflow-hidden hover:shadow-md transition-shadow group">
                    {/* Room Image */}
                    <div className="h-48 sm:h-52 lg:h-56 relative overflow-hidden bg-gradient-to-br from-surface to-outline-variant">
                      {finalSrc ? (
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
                          <BedDouble size={40} className="text-outline" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-heading font-semibold text-base text-on-surface">{room.name}</h3>
                      {room.short_description && (
                        <p className="text-sm text-on-surface-variant line-clamp-2">{room.short_description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                        {room.max_occupancy && (
                          <span className="flex items-center gap-1"><Users size={12} />{room.max_occupancy} Guests</span>
                        )}
                        {room.size_sqft && (
                          <span className="flex items-center gap-1"><Maximize2 size={12} />{room.size_sqft} sq ft</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Wi-Fi', 'AC', 'TV'].map((a) => (
                          <span key={a} className="px-2.5 py-1 bg-surface text-caption text-on-surface-variant rounded">{a}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                        <div>
                          <span className="price-tag text-xl">
                            ₹{room.base_price?.toLocaleString('en-IN') ?? '—'}
                          </span>
                          <span className="text-caption text-on-surface-variant"> / night</span>
                        </div>
                        <Link
                          href={`/rooms/${room.slug || room.id}`}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                // Fallback skeleton if DB returns nothing
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card-base bg-white h-80 flex items-center justify-center text-on-surface-variant animate-pulse">
                    <BedDouble size={32} className="opacity-30" />
                  </div>
                ))
              )}
            </div>

            <div className="text-center mt-10">
              <Link
                href={ROUTES.rooms}
                className="btn-outline inline-flex items-center gap-2 px-7 py-3"
              >
                View All Rooms →
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials — Live approved reviews or fallback */}
        <section className="section-gap bg-surface" aria-labelledby="testimonials-heading">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="text-label-md text-primary uppercase tracking-widest mb-3 font-semibold">Guest Reviews</p>
              <h2 id="testimonials-heading" className="font-heading text-headline-lg text-on-surface mb-2 section-heading-accent">
                What Our Guests Say
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedReviews.length > 0 ? approvedReviews.map((review) => {
                const guestName = Array.isArray(review.profiles)
                  ? review.profiles[0]?.full_name
                  : review.profiles?.full_name;
                const initials = guestName ? guestName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'G';
                return (
                  <div key={review.id} className="bg-white p-6 rounded-2xl border border-outline-variant space-y-4 hover:shadow-md transition-shadow relative">
                    {/* Decorative quote */}
                    <span className="absolute top-4 right-4 text-5xl font-serif text-primary/10 leading-none select-none">&ldquo;</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={14} className={s < (review.overall_rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'} />
                      ))}
                    </div>
                    {review.title && <p className="font-semibold text-sm text-on-surface">{review.title}</p>}
                    <p className="text-on-surface-variant text-sm leading-relaxed italic line-clamp-4">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
                      <p className="text-xs text-primary font-semibold">— {guestName ?? 'Verified Guest'}</p>
                    </div>
                  </div>
                );
              }) : fallbackReviews.map((review) => (
                <div key={review.name} className="bg-white p-6 rounded-2xl border border-outline-variant space-y-4 hover:shadow-md transition-shadow relative">
                  <span className="absolute top-4 right-4 text-5xl font-serif text-primary/10 leading-none select-none">&ldquo;</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{review.name[0]}</div>
                    <p className="text-xs text-primary font-semibold">— {review.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary-gradient text-white" aria-labelledby="cta-heading">
          <div className="container-custom text-center">
            <h2 id="cta-heading" className="font-heading text-headline-lg mb-4">
              Ready for an Unforgettable Stay?
            </h2>
            <p className="text-body-lg text-white/80 mb-8 max-w-xl mx-auto">
              Book directly and get the best rates. No hidden charges, guaranteed.
            </p>
            <Link
              href={ROUTES.rooms}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-heading font-bold rounded-lg hover:bg-white/90 transition-colors shadow-level-3"
            >
              Book Your Room →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
