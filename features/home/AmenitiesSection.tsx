'use client';

import { motion } from 'framer-motion';
import {
  Wifi, Coffee, Car, Utensils, Dumbbell, Wind,
  Tv, ShieldCheck, Briefcase, Phone,
} from 'lucide-react';
import { staggerContainer, slideUp } from '@/styles/animations';

const AMENITIES = [
  { icon: Wifi, label: 'High-Speed Wi-Fi', description: 'Complimentary in all rooms' },
  { icon: Utensils, label: 'Restaurant & Dining', description: 'In-house multi-cuisine dining' },
  { icon: Car, label: 'Free Parking', description: 'Covered parking available' },
  { icon: Coffee, label: 'Café & Lounge', description: 'Open 7 AM – 11 PM' },
  { icon: Dumbbell, label: 'Fitness Center', description: 'Fully equipped gym' },
  { icon: Wind, label: 'AC Rooms', description: 'Centralised air conditioning' },
  { icon: Tv, label: 'Smart TV', description: '40" LED with streaming' },
  { icon: ShieldCheck, label: '24/7 Security', description: 'CCTV & in-person security' },
  { icon: Briefcase, label: 'Business Center', description: 'Meeting rooms & printing' },
  { icon: Phone, label: 'Concierge', description: 'Round-the-clock assistance' },
];

export function AmenitiesSection() {
  return (
    <section
      className="section-gap bg-surface"
      aria-labelledby="amenities-heading"
    >
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-label-md text-primary uppercase tracking-widest mb-3">
            World-Class Amenities
          </p>
          <h2
            id="amenities-heading"
            className="font-heading text-headline-lg text-on-surface mb-4 text-balance"
          >
            Everything You Need, Under One Roof
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Designed for business travelers and leisure guests alike, our amenities ensure
            a comfortable and productive stay.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {AMENITIES.map((amenity) => {
            const Icon = amenity.icon;
            return (
              <motion.div
                key={amenity.label}
                variants={slideUp}
                className="flex flex-col items-center text-center p-5 bg-white rounded-lg border border-outline-variant hover:border-primary/30 hover:shadow-level-2 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <Icon size={22} className="text-primary" aria-hidden="true" />
                </div>
                <span className="font-heading font-semibold text-sm text-on-surface mb-1">
                  {amenity.label}
                </span>
                <span className="text-caption text-on-surface-variant leading-relaxed">
                  {amenity.description}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
