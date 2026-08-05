import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, MapPin, Wifi, AirVent, Clock, ShieldCheck,
  Coffee, Users, BedDouble, Award, Heart, Zap,
  Phone, Mail, Navigation, ChevronRight, Building2,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = createMetadata({
  title: 'About Us — Super Townhouse',
  description:
    'Learn about Super Townhouse — our story, values, and commitment to delivering premium hospitality at honest prices in Whitefield ITPL, Bengaluru.',
});

export default async function AboutPage() {
  // Fetch room images for gallery display
  let galleryImages: { src: string; alt: string }[] = [];
  let approvedReviewCount = 0;

  try {
    const supabase = await createServerClient();
    const db = supabase as any;

    const { data: rooms } = await db
      .from('room_types')
      .select('name, image_url, thumbnail_url')
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .limit(4);

    if (rooms) {
      galleryImages = rooms.map((r: any) => ({
        src: r.image_url || r.thumbnail_url,
        alt: r.name,
      }));
    }

    const { count } = await db
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
    approvedReviewCount = count ?? 0;
  } catch { /* fallback silently */ }

  const stats = [
    { value: `${SITE_CONFIG.hotel.totalRooms}+`, label: 'Premium Rooms' },
    { value: `${SITE_CONFIG.hotel.starRating}★`, label: 'Star Hotel' },
    { value: `${SITE_CONFIG.rating.score}`, label: 'Google Rating' },
    { value: approvedReviewCount > 0 ? `${approvedReviewCount}+` : '1200+', label: 'Happy Guests' },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Guest-First Always',
      desc: 'Every policy, every service, every detail is designed around what makes your stay better.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Pricing',
      desc: 'No hidden fees, no surprises at checkout. The price you see is exactly what you pay.',
    },
    {
      icon: Zap,
      title: 'Fast & Responsive',
      desc: 'Quick check-in, 24/7 front desk, and same-day request resolution — because your time matters.',
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      desc: 'We maintain consistent standards across every room, every day — clean, comfortable, and ready.',
    },
    {
      icon: Users,
      title: 'Built for Business',
      desc: 'High-speed Wi-Fi, quiet work environment, and proximity to ITPL — perfect for corporate stays.',
    },
    {
      icon: Coffee,
      title: 'Local Warmth',
      desc: 'The genuine warmth of Bengaluru hospitality in every interaction with our team.',
    },
  ];

  const amenities = [
    { icon: Wifi,     label: 'High-Speed Wi-Fi' },
    { icon: AirVent,  label: 'Air Conditioning' },
    { icon: Coffee,   label: 'In-Room Amenities' },
    { icon: Clock,    label: '24/7 Front Desk' },
    { icon: ShieldCheck, label: 'CCTV Security' },
    { icon: BedDouble,label: 'Premium Bedding' },
  ];

  const nearby = [
    { place: 'ITPL Tech Park',       distance: '0.5 km' },
    { place: 'Prestige Shantiniketan', distance: '1.2 km' },
    { place: 'Whitefield Railway Station', distance: '2.1 km' },
    { place: 'Aster Hospital',        distance: '0.3 km' },
    { place: 'Phoenix Marketcity',    distance: '4.5 km' },
    { place: 'Kempegowda Airport',    distance: '38 km' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-outline-variant py-4">
        <div className="container-custom">
          <Breadcrumb />
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary/90 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e31837 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)' }} />
        <div className="container-custom relative z-10 py-20 md:py-28">
          <p className="text-primary-light text-label-md uppercase tracking-widest mb-3 text-red-300">Est. in Whitefield, Bengaluru</p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            About<br className="hidden md:block" />{' '}
            <span className="text-red-400">Super Townhouse</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl leading-relaxed mb-8">
            A premium 3-star hotel in the heart of ITPL, Whitefield — where modern comfort meets
            warm hospitality at prices that make sense.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ROUTES.rooms}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
              Explore Rooms <ChevronRight size={16} />
            </Link>
            <Link href={ROUTES.contact}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── Stats Bar ── */}
      <section className="container-custom -mt-1 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label}
              className="bg-white border border-outline-variant rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="font-heading text-3xl font-bold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="container-custom space-y-20 pb-20">

        {/* ── Our Story ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" aria-labelledby="story-heading">
          <div className="space-y-5 order-2 lg:order-1">
            <p className="text-label-md text-primary uppercase tracking-widest">Our Story</p>
            <h2 id="story-heading" className="font-heading text-headline-md text-on-surface leading-tight">
              Redefining Business Travel<br className="hidden md:block" /> in Bengaluru
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Super Townhouse was founded with a simple belief — that premium hospitality
              shouldn't come at premium prices. Nestled in the heart of the ITPL tech corridor
              in Whitefield, Bengaluru, we serve the city's dynamic business community and
              leisure travellers alike.
            </p>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              We built every room, designed every policy, and trained every team member with
              one goal: to make your stay effortless, comfortable, and genuinely enjoyable —
              whether you're here for a one-night business trip or an extended project stay.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex gap-0.5">
                {Array.from({ length: SITE_CONFIG.hotel.starRating }).map((_, i) => (
                  <Star key={i} size={18} fill="#e31837" className="text-primary" />
                ))}
              </div>
              <span className="text-sm text-on-surface-variant">
                {SITE_CONFIG.hotel.starRating}-Star Certified · {SITE_CONFIG.hotel.totalRooms} Rooms · Whitefield ITPL
              </span>
            </div>
          </div>

          {/* Gallery grid */}
          <div className="order-1 lg:order-2">
            {galleryImages.length >= 2 ? (
              <div className="grid grid-cols-2 gap-3 h-80">
                {galleryImages.slice(0, 4).map((img, i) => (
                  <div key={i} className={`relative rounded-xl overflow-hidden bg-surface-container ${i === 0 ? 'row-span-2' : ''}`}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      unoptimized={img.src.startsWith('http')}
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80 bg-gradient-to-br from-primary/10 to-surface-container rounded-2xl flex flex-col items-center justify-center gap-4 border border-outline-variant">
                <Building2 size={56} className="text-primary/40" />
                <p className="text-sm text-on-surface-variant">Super Townhouse · Whitefield, Bengaluru</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Amenities Strip ── */}
        <section className="bg-primary/5 rounded-2xl p-8" aria-labelledby="amenities-heading">
          <p className="text-label-md text-primary uppercase tracking-widest text-center mb-2">What We Offer</p>
          <h2 id="amenities-heading" className="font-heading text-headline-md text-on-surface text-center mb-10">
            Everything You Need, Nothing You Don't
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {amenities.map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex flex-col items-center gap-3 bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <p className="text-xs font-medium text-on-surface leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our Values ── */}
        <section aria-labelledby="values-heading">
          <p className="text-label-md text-primary uppercase tracking-widest text-center mb-2">Our Promises</p>
          <h2 id="values-heading" className="font-heading text-headline-md text-on-surface text-center mb-10">
            The Values We Live By
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group bg-white rounded-xl border border-outline-variant p-6 space-y-3 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={22} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading font-semibold text-base text-on-surface">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Location ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" aria-labelledby="location-heading">
          <div className="space-y-5">
            <p className="text-label-md text-primary uppercase tracking-widest">Our Location</p>
            <h2 id="location-heading" className="font-heading text-headline-md text-on-surface leading-tight">
              Right in the Heart of<br className="hidden md:block" /> ITPL, Whitefield
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Located at{' '}
              <span className="font-medium text-on-surface">
                {SITE_CONFIG.location.address}, {SITE_CONFIG.location.city}
              </span>
              {' '}— we're steps away from Bengaluru's largest tech park, making us the
              preferred choice for IT professionals and corporate travellers.
            </p>
            <div className="space-y-3">
              {nearby.map(({ place, distance }) => (
                <div key={place} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-on-surface flex-1">{place}</span>
                  <span className="text-sm text-primary font-semibold">{distance}</span>
                </div>
              ))}
            </div>
            <Link href={SITE_CONFIG.location.googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline">
              <Navigation size={14} />
              Get Directions on Google Maps ↗
            </Link>
          </div>

          {/* Contact details */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-outline-variant p-6 space-y-5">
              <h3 className="font-heading font-semibold text-base text-on-surface">Reach Us Directly</h3>
              <div className="space-y-4">
                <a href={`tel:${SITE_CONFIG.contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                    <Phone size={16} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Phone</p>
                    <p className="text-sm font-medium text-on-surface">{SITE_CONFIG.contact.phone}</p>
                  </div>
                </a>
                <a href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                    <Mail size={16} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Email</p>
                    <p className="text-sm font-medium text-on-surface">{SITE_CONFIG.contact.email}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Address</p>
                    <p className="text-sm font-medium text-on-surface leading-snug">
                      {SITE_CONFIG.location.address},<br />
                      {SITE_CONFIG.location.city}, {SITE_CONFIG.location.state} — {SITE_CONFIG.location.pincode}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-outline-variant grid grid-cols-2 gap-3 text-center text-sm">
                <div>
                  <p className="text-on-surface-variant text-xs mb-0.5">Check-in</p>
                  <p className="font-semibold text-on-surface">{SITE_CONFIG.hotel.checkInTime}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-xs mb-0.5">Check-out</p>
                  <p className="font-semibold text-on-surface">{SITE_CONFIG.hotel.checkOutTime}</p>
                </div>
              </div>
            </div>

            {/* Google Rating */}
            <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="font-heading text-3xl font-bold text-on-surface">{SITE_CONFIG.rating.score}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12}
                      className={i < Math.round(SITE_CONFIG.rating.score) ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'} />
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{SITE_CONFIG.rating.count}+ reviews</p>
              </div>
              <div>
                <p className="font-medium text-on-surface text-sm">Rated on {SITE_CONFIG.rating.platform}</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Our guests consistently rate us highly for cleanliness, location, and value for money.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-r from-primary to-red-700 rounded-2xl p-10 text-white text-center">
          <h2 className="font-heading text-headline-md mb-3">Experience It for Yourself</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Book directly for the best rates — no third-party fees, no hidden charges.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={ROUTES.rooms}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-bold rounded-lg hover:bg-white/90 transition-colors shadow-lg">
              Book Your Stay <ChevronRight size={16} />
            </Link>
            <Link href={ROUTES.contact}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
              Get in Touch
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
