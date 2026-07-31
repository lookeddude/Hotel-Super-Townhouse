'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { createClient } from '@supabase/supabase-js';

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Responsive sizes:
// Mobile  (<640px)  → serve 640px wide image
// Tablet  (<1024px) → serve 1080px wide image  
// Desktop (≥1024px) → serve 1920px wide image
const HERO_SIZES = '(max-width: 640px) 640px, (max-width: 1024px) 1080px, 1920px';

interface Slide {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  sort_order: number;
}

export function HeroSection() {
  const [slides, setSlides]       = useState<Slide[]>([]);
  const [current, setCurrent]     = useState(0);
  const [interval, setIntervalMs] = useState(4000);
  const [loaded, setLoaded]       = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch slides + interval setting from DB
  useEffect(() => {
    async function load() {
      const [{ data: sl }, { data: st }] = await Promise.all([
        supabasePublic
          .from('hero_slides')
          .select('id, image_url, title, subtitle, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabasePublic
          .from('settings')
          .select('value')
          .eq('key', 'slideshow_interval')
          .single(),
      ]);
      if (sl && sl.length > 0) setSlides(sl);
      if (st?.value) setIntervalMs(Number(st.value) * 1000);
      setLoaded(true);
    }
    load();
  }, []);

  // Auto-advance
  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, interval, next, slides.length]);

  const currentSlide = slides[current];

  return (
    <section
      className="relative min-h-[55vh] md:min-h-[70vh] lg:min-h-[90vh] flex items-center overflow-hidden"
      aria-label="Hero — Super Townhouse"
    >

      {/* ── Background slides ── */}
      {loaded && slides.length > 0 ? (
        slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== current}
          >
            <Image
              src={slide.image_url.startsWith('http') ? slide.image_url : slide.image_url}
              alt={slide.title ?? `Slide ${i + 1}`}
              fill
              quality={85}
              className="object-cover object-center"
              priority={i === 0}
              sizes={HERO_SIZES}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </div>
        ))
      ) : (
        /* Fallback gradient when no slides */
        <div className="absolute inset-0 bg-gradient-to-br from-inverse-surface via-[#1a0408] to-[#2d0a10]" aria-hidden="true">
          <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* ── Slide nav arrows ── */}
      {slides.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setCurrent(i); }}
              className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 container-custom w-full py-20">
        <div className="max-w-3xl">

          {/* Location + rating badges */}
          <div className="inline-flex items-center gap-2 mb-6 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm">
              <MapPin size={12} className="text-primary" />
              <span>{SITE_CONFIG.location.address}, {SITE_CONFIG.location.city}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm">
              <Star size={12} fill="#e31837" className="text-primary" />
              <span>{SITE_CONFIG.rating.score} · {SITE_CONFIG.rating.count.toLocaleString('en-IN')} Reviews</span>
            </div>
          </div>

          {/* Headline — dynamic from slide or default */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            {currentSlide?.title ?? 'Premium Stays in the'}
            {!currentSlide?.title && <span className="block text-primary">Heart of Whitefield</span>}
          </h1>

          {/* Subtext */}
          <p className="text-lg text-white/75 mb-10 max-w-xl leading-relaxed">
            {currentSlide?.subtitle ?? `Experience modern comfort and impeccable hospitality at ITPL, Bengaluru's premier business district.`}
          </p>

          {/* CTA */}
          <Link href={ROUTES.rooms}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white font-semibold text-lg rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg group">
            <Search size={20} />
            Explore Rooms
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Trust bar */}
          <div className="mt-14 flex flex-wrap items-center gap-8">
            {[
              { label: 'Total Rooms', value: `${SITE_CONFIG.hotel.totalRooms}+` },
              { label: 'Check-in',   value: SITE_CONFIG.hotel.checkInTime },
              { label: 'Check-out',  value: SITE_CONFIG.hotel.checkOutTime },
              { label: 'Star Rating', value: `${SITE_CONFIG.hotel.starRating} Star` },
            ].map(stat => (
              <div key={stat.label} className="text-white">
                <div className="font-heading font-bold text-2xl text-primary">{stat.value}</div>
                <div className="text-sm text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
