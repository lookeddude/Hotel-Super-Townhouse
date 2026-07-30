import type { Metadata } from 'next';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { HeroSection } from '@/features/home/HeroSection';
import { AmenitiesSection } from '@/features/home/AmenitiesSection';
import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = createMetadata({
  title: 'Super Townhouse — Premium Hotel in Whitefield, Bengaluru',
  description:
    'Book a premium stay at Super Townhouse, Whitefield ITPL Bengaluru. Modern rooms, world-class amenities, and impeccable hospitality await you.',
});

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <HeroSection />

        {/* Amenities */}
        <AmenitiesSection />

        {/* Featured Rooms */}
        <section className="section-gap bg-background" aria-labelledby="featured-rooms-heading">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="text-label-md text-primary uppercase tracking-widest mb-3">Our Rooms</p>
              <h2
                id="featured-rooms-heading"
                className="font-heading text-headline-lg text-on-surface mb-4"
              >
                Rooms & Suites
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
                From cozy standard rooms to spacious suites — every room is designed for your comfort.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Standard Room', price: '₹2,499', guests: '2', size: '250 sq ft', color: 'bg-blue-50' },
                { name: 'Deluxe King Room', price: '₹3,499', guests: '2', size: '350 sq ft', color: 'bg-primary/5' },
                { name: 'Executive Suite', price: '₹5,999', guests: '4', size: '550 sq ft', color: 'bg-green-50' },
              ].map((room) => (
                <div
                  key={room.name}
                  className="card-base bg-white group"
                >
                  <div className={`h-52 ${room.color} flex items-center justify-center`}>
                    <span className="text-4xl">🛏️</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-heading font-semibold text-base text-on-surface">{room.name}</h3>
                    <div className="flex gap-4 text-caption text-on-surface-variant">
                      <span>👥 {room.guests} Guests</span>
                      <span>📐 {room.size}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Wi-Fi', 'AC', 'TV'].map((a) => (
                        <span key={a} className="px-2.5 py-1 bg-surface text-caption text-on-surface-variant rounded">
                          {a}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                      <div>
                        <span className="price-tag text-xl">{room.price}</span>
                        <span className="text-caption text-on-surface-variant"> / night</span>
                      </div>
                      <Link
                        href={ROUTES.rooms}
                        className="px-4 py-2 bg-primary text-white text-label-md rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href={ROUTES.rooms}
                className="inline-flex items-center gap-2 px-7 py-3 border-2 border-primary text-primary font-heading font-semibold rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                View All Rooms →
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-gap bg-surface" aria-labelledby="testimonials-heading">
          <div className="container-custom">
            <div className="text-center mb-12">
              <p className="text-label-md text-primary uppercase tracking-widest mb-3">Guest Reviews</p>
              <h2 id="testimonials-heading" className="font-heading text-headline-lg text-on-surface mb-4">
                What Our Guests Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Arjun Mehta', rating: 5, text: 'Excellent stay! Very clean, well-maintained, and the staff was incredibly helpful. Perfect for my business trip to Whitefield.' },
                { name: 'Priya Sharma', rating: 5, text: 'The rooms are spacious and the Wi-Fi is super fast. Great location near ITPL. Will definitely book again!' },
                { name: 'Rahul Nair', rating: 4, text: 'Good value for money. The restaurant food was amazing. Checkout was smooth and staff was very courteous.' },
              ].map((review) => (
                <div key={review.name} className="bg-white p-6 rounded-lg border border-outline-variant space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i} className="text-primary text-base">★</span>
                    ))}
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed italic">
                    "{review.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {review.name[0]}
                    </div>
                    <p className="font-heading font-semibold text-sm text-on-surface">{review.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 bg-primary-gradient text-white"
          aria-labelledby="cta-heading"
        >
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
