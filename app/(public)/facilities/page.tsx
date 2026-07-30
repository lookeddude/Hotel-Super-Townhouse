import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Wifi, Car, Utensils, Dumbbell, Wind, ShieldCheck, Briefcase, Coffee } from 'lucide-react';

export const metadata: Metadata = createMetadata({
  title: 'Facilities',
  description: 'Explore all facilities at Super Townhouse — restaurant, gym, parking, business center, and more.',
});

const FACILITIES = [
  { icon: Utensils, name: 'Restaurant', description: 'Multi-cuisine in-house dining available for breakfast, lunch, and dinner.', hours: '7:00 AM – 11:00 PM' },
  { icon: Coffee, name: 'Café & Lounge', description: 'Relaxed lounge with specialty coffees and light snacks.', hours: '6:00 AM – 11:00 PM' },
  { icon: Dumbbell, name: 'Fitness Center', description: 'Fully equipped modern gymnasium with cardio and weight training.', hours: '5:00 AM – 10:00 PM' },
  { icon: Wifi, name: 'High-Speed Wi-Fi', description: 'Complimentary 100 Mbps fiber Wi-Fi throughout the property.', hours: '24/7' },
  { icon: Car, name: 'Covered Parking', description: 'Free covered parking for all guests. Valet available.', hours: '24/7' },
  { icon: Briefcase, name: 'Business Center', description: 'Meeting rooms, printing, and video conferencing facilities.', hours: '8:00 AM – 8:00 PM' },
  { icon: Wind, name: 'Air Conditioning', description: 'Centralised AC with individual room control.', hours: '24/7' },
  { icon: ShieldCheck, name: '24/7 Security', description: 'CCTV surveillance and on-site security team.', hours: '24/7' },
];

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Facilities</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Everything you need for a comfortable stay</p>
        </div>
      </div>
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FACILITIES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.name} className="bg-white rounded-lg border border-outline-variant p-6 flex gap-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-heading font-semibold text-base text-on-surface">{f.name}</h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
                  <p className="text-caption text-primary font-medium">Hours: {f.hours}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
