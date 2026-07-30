import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { MapPin, Star } from 'lucide-react';

export const metadata: Metadata = createMetadata({
  title: 'About Us',
  description: 'Learn about Super Townhouse — our story, values, and commitment to premium hospitality in Whitefield, Bengaluru.',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">About Super Townhouse</h1>
        </div>
      </div>
      <div className="container-custom py-12 space-y-16">
        {/* Story */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" aria-labelledby="story-heading">
          <div className="space-y-5">
            <p className="text-label-md text-primary uppercase tracking-widest">Our Story</p>
            <h2 id="story-heading" className="font-heading text-headline-md text-on-surface">
              Redefining Business Travel in Bengaluru
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Super Townhouse was founded with a simple belief — that premium hospitality shouldn't come at premium prices.
              Located in the heart of ITPL, Whitefield, we serve the city's dynamic business community and leisure travelers alike.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {Array.from({ length: SITE_CONFIG.hotel.starRating }).map((_, i) => (
                  <Star key={i} size={18} fill="#e31837" className="text-primary" />
                ))}
              </div>
              <span className="text-sm text-on-surface-variant">
                {SITE_CONFIG.hotel.starRating}-Star Hotel · {SITE_CONFIG.hotel.totalRooms} Rooms
              </span>
            </div>
          </div>
          <div className="h-80 bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant">
            <MapPin size={48} className="text-outline" />
          </div>
        </section>

        {/* Values */}
        <section aria-labelledby="values-heading">
          <h2 id="values-heading" className="font-heading text-headline-md text-on-surface text-center mb-10">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Comfort First', desc: 'Every detail is designed around your comfort and convenience.' },
              { title: 'Transparent Pricing', desc: 'No hidden fees. What you see is what you pay.' },
              { title: 'Local Warmth', desc: 'Bengaluru\'s warmth and hospitality in every interaction.' },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-lg border border-outline-variant p-6 space-y-3">
                <div className="w-8 h-1 bg-primary rounded-full" />
                <h3 className="font-heading font-semibold text-base text-on-surface">{v.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
