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

// ── Image sizes per device ─────────────────────────────────────────────────────
// Next.js serves the smallest matching image automatically
const DESKTOP_SIZES = '(max-width: 1024px) 0px, 1920px';
const TABLET_SIZES  = '(max-width: 768px) 0px, (max-width: 1024px) 1080px, 0px';
const MOBILE_SIZES  = '(max-width: 768px) 640px, 0px';

interface Slide {
  id:                string;
  image_url:         string;       // desktop  (1920×900, 16:9)
  mobile_image_url:  string|null;  // mobile   (900×1200, 3:4 portrait)
  tablet_image_url:  string|null;  // tablet   (1080×1080, 1:1 square)
  title?:            string;
  subtitle?:         string;
  sort_order:        number;
}

export function HeroSection() {
  const [slides, setSlides]       = useState<Slide[]>([]);
  const [current, setCurrent]     = useState(0);
  const [intervalMs, setIntervalMs] = useState(4000);
  const [loaded, setLoaded]       = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: sl }, { data: st }] = await Promise.all([
        supabasePublic
          .from('hero_slides')
          .select('id, image_url, mobile_image_url, tablet_image_url, title, subtitle, sort_order')
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

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, intervalMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, intervalMs, next, slides.length]);

  const currentSlide = slides[current];

  return (
    <section
      className="relative min-h-[55vh] md:min-h-[70vh] lg:min-h-[90vh] flex items-center overflow-hidden"
      aria-label="Hero — Super Townhouse"
    >
      {/* ── Background slides ── */}
      {loaded && slides.length > 0 ? (
        slides.map((slide, i) => {
          const isActive = i === current;
          // Fallbacks: mobile → desktop, tablet → desktop
          const mobileImg  = slide.mobile_image_url || slide.image_url;
          const tabletImg  = slide.tablet_image_url || slide.image_url;
          const desktopImg = slide.image_url;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden={!isActive}
            >
              {/* ── MOBILE image (< 768px) ── portrait 3:4 */}
              <div className="absolute inset-0 block md:hidden">
                <Image
                  src={mobileImg}
                  alt={slide.title ?? `Slide ${i + 1}`}
                  fill
                  quality={85}
                  className="object-cover object-center"
                  priority={i === 0}
                  sizes={MOBILE_SIZES}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>

              {/* ── TABLET image (768px–1024px) ── square 1:1 */}
              <div className="absolute inset-0 hidden md:block lg:hidden">
                <Image
                  src={tabletImg}
                  alt={slide.title ?? `Slide ${i + 1}`}
                  fill
                  quality={85}
                  className="object-cover object-center"
                  priority={i === 0}
                  sizes={TABLET_SIZES}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>

              {/* ── DESKTOP image (>= 1024px) ── landscape 16:9 */}
              <div className="absolute inset-0 hidden lg:block">
                <Image
                  src={desktopImg}
                  alt={slide.title ?? `Slide ${i + 1}`}
                  fill
                  quality={85}
                  className="object-cover object-center"
                  priority={i === 0}
                  sizes={DESKTOP_SIZES}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>

              {/* Dark gradient overlay — same on all devices */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
            </div>
          );
        })
      ) : (
        /* Fallback gradient when no slides loaded yet */
        <div className="absolute inset-0 bg-gradient-to-br from-inverse-surface via-[#1a0408] to-[#2d0a10]" aria-hidden="true">
          <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* ── Prev / Next arrows ── */}
      {slides.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-black/30 hover:bg-black/55 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            aria-label="Previous slide">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-black/30 hover:bg-black/55 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            aria-label="Next slide">
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button key={i}
              onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setCurrent(i); }}
              className={`transition-all rounded-full ${i === current ? 'w-5 md:w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 container-custom w-full py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">

          {/* Location + rating badges */}
          <div className="inline-flex items-center gap-2 mb-4 md:mb-6 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs md:text-sm">
              <MapPin size={11} className="text-primary" />
              <span>{SITE_CONFIG.location.address}, {SITE_CONFIG.location.city}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs md:text-sm">
              <Star size={11} fill="#e31837" className="text-primary" />
              <span>{SITE_CONFIG.rating.score} · {SITE_CONFIG.rating.count.toLocaleString('en-IN')} Reviews</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl text-white mb-4 md:mb-6 leading-tight">
            {currentSlide?.title
              ? currentSlide.title
              : <>Premium Stays in the <span className="block text-primary">Heart of Whitefield</span></>}
          </h1>

          {/* Subtext */}
          <p className="text-sm md:text-lg text-white/75 mb-6 md:mb-10 max-w-xl leading-relaxed">
            {currentSlide?.subtitle
              ?? `Experience modern comfort and impeccable hospitality at ITPL, Bengaluru's premier business district.`}
          </p>

          {/* CTA */}
          <Link href={ROUTES.rooms}
            className="inline-flex items-center gap-2 md:gap-3 px-5 py-3 md:px-8 md:py-4 bg-primary text-white font-semibold text-base md:text-lg rounded-lg hover:opacity-90 transition-all shadow-lg group">
            <Search size={18} />
            Explore Rooms
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Trust bar — hidden on mobile to save space */}
          <div className="mt-10 md:mt-14 hidden sm:flex flex-wrap items-center gap-6 md:gap-8">
            {[
              { label: 'Total Rooms', value: `${SITE_CONFIG.hotel.totalRooms}+` },
              { label: 'Check-in',   value: SITE_CONFIG.hotel.checkInTime },
              { label: 'Check-out',  value: SITE_CONFIG.hotel.checkOutTime },
              { label: 'Star Rating', value: `${SITE_CONFIG.hotel.starRating} Star` },
            ].map(stat => (
              <div key={stat.label} className="text-white">
                <div className="font-heading font-bold text-xl md:text-2xl text-primary">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
