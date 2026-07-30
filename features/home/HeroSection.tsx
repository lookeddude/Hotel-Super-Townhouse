'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { fadeIn, slideUp, staggerContainer } from '@/styles/animations';
import { ROUTES } from '@/constants/routes';
import { SITE_CONFIG } from '@/constants/siteConfig';

export function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      aria-label="Hero — Super Townhouse"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-inverse-surface via-[#1a0408] to-[#2d0a10]" aria-hidden="true" />

      {/* Background image overlay (replace with Next.js Image once assets are loaded) */}
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
        aria-hidden="true"
      />

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 container-custom w-full py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Location badge */}
          <motion.div variants={slideUp} className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-caption">
              <MapPin size={12} className="text-primary" aria-hidden="true" />
              <span>{SITE_CONFIG.location.address}, {SITE_CONFIG.location.city}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-caption">
              <Star size={12} fill="#e31837" className="text-primary" aria-hidden="true" />
              <span>{SITE_CONFIG.rating.score} · {SITE_CONFIG.rating.count.toLocaleString('en-IN')} Reviews</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="font-heading text-4xl md:text-5xl lg:text-display text-white mb-6 leading-tight text-balance"
          >
            Premium Stays in the
            <span className="block text-primary">Heart of Whitefield</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={slideUp}
            className="text-body-lg text-white/75 mb-10 max-w-xl leading-relaxed"
          >
            Experience modern comfort and impeccable hospitality at ITPL, Bengaluru's
            premier business district. Your perfect stay awaits.
          </motion.p>

          {/* Search CTA */}
          <motion.div variants={slideUp}>
            <Link
              href={ROUTES.rooms}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white font-heading font-semibold text-lg rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-level-3 hover:shadow-none hover:translate-y-0.5 group"
              aria-label="Explore available rooms"
            >
              <Search size={20} aria-hidden="true" />
              Explore Rooms
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            variants={fadeIn}
            className="mt-14 flex flex-wrap items-center gap-8"
          >
            {[
              { label: 'Total Rooms', value: `${SITE_CONFIG.hotel.totalRooms}+` },
              { label: 'Check-in', value: SITE_CONFIG.hotel.checkInTime },
              { label: 'Check-out', value: SITE_CONFIG.hotel.checkOutTime },
              { label: 'Star Rating', value: `${SITE_CONFIG.hotel.starRating} Star` },
            ].map((stat) => (
              <div key={stat.label} className="text-white">
                <div className="font-heading font-bold text-2xl text-primary">{stat.value}</div>
                <div className="text-caption text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
