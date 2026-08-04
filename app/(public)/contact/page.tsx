import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { MapPin, Phone, Mail, Clock, Share2, ExternalLink, Globe } from 'lucide-react';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { createServerClient } from '@/lib/supabase/server';
import { ContactForm } from '@/features/contact/ContactForm';

export const metadata: Metadata = createMetadata({
  title: 'Contact Us',
  description: 'Get in touch with Super Townhouse. Find our address, phone, email, and location map in Whitefield, Bengaluru.',
});

export default async function ContactPage() {
  // Fetch hotel info from DB; fall back to SITE_CONFIG
  let hotel: any = null;
  try {
    const supabase = await createServerClient();
    const { data } = await (supabase as any)
      .from('hotel_information')
      .select('name, phone_primary, phone_secondary, email, address_line1, address_line2, city, state, postal_code, check_in_time, check_out_time, social_instagram, social_facebook, social_twitter, latitude, longitude')
      .limit(1)
      .maybeSingle();
    hotel = data;
  } catch {
    // Fall back to SITE_CONFIG
  }

  const phone = hotel?.phone_primary || SITE_CONFIG.contact.phone;
  const email = hotel?.email || SITE_CONFIG.contact.email;
  const address = hotel
    ? [hotel.address_line1, hotel.address_line2, hotel.city, hotel.state, hotel.postal_code].filter(Boolean).join(', ')
    : `${SITE_CONFIG.location.address}, ${SITE_CONFIG.location.city}, ${SITE_CONFIG.location.state} ${SITE_CONFIG.location.pincode}`;
  const checkInTime = hotel?.check_in_time || SITE_CONFIG.hotel.checkInTime;
  const checkOutTime = hotel?.check_out_time || SITE_CONFIG.hotel.checkOutTime;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-outline-variant py-8">
        <div className="container-custom">
          <Breadcrumb className="mb-3" />
          <h1 className="font-heading text-headline-lg text-on-surface">Contact Us</h1>
          <p className="text-body-md text-on-surface-variant mt-2">We&apos;d love to hear from you</p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-headline-md text-on-surface mb-6">Get in Touch</h2>
              <div className="space-y-5">
                {[
                  {
                    icon: MapPin,
                    label: 'Address',
                    value: address,
                    href: SITE_CONFIG.location.googleMapsUrl,
                  },
                  {
                    icon: Phone,
                    label: 'Phone',
                    value: phone,
                    href: `tel:${phone}`,
                  },
                  hotel?.phone_secondary ? {
                    icon: Phone,
                    label: 'Alternate Phone',
                    value: hotel.phone_secondary,
                    href: `tel:${hotel.phone_secondary}`,
                  } : null,
                  {
                    icon: Mail,
                    label: 'Email',
                    value: email,
                    href: `mailto:${email}`,
                  },
                  {
                    icon: Clock,
                    label: 'Check-in / Check-out',
                    value: `Check-in: ${checkInTime} · Check-out: ${checkOutTime}`,
                  },
                ].filter(Boolean).map((item: any) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                        <p className="text-sm text-on-surface-variant mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <a key={item.label} href={item.href} className="block hover:opacity-80 transition-opacity" target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{content}</a>
                  ) : (
                    <div key={item.label}>{content}</div>
                  );
                })}
              </div>
            </div>

            {/* Social links from DB */}
            {(hotel?.social_instagram || hotel?.social_facebook || hotel?.social_twitter) && (
              <div>
                <p className="text-sm font-semibold text-on-surface mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {hotel?.social_instagram && (
                    <a href={hotel.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white text-on-surface-variant transition-colors" aria-label="Instagram">
                      <Share2 size={18} />
                    </a>
                  )}
                  {hotel?.social_facebook && (
                    <a href={hotel.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white text-on-surface-variant transition-colors" aria-label="Facebook">
                      <Globe size={18} />
                    </a>
                  )}
                  {hotel?.social_twitter && (
                    <a href={hotel.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white text-on-surface-variant transition-colors" aria-label="X / Twitter">
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="h-64 bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
              {hotel?.latitude && hotel?.longitude ? (() => {
                const lat = hotel.latitude;
                const lng = hotel.longitude;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=16`;
                return (
                  <>
                    <iframe
                      title="Hotel Location"
                      src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                    <div className="text-center py-1">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">
                        Open in Google Maps ↗
                      </a>
                    </div>
                  </>
                );
              })() : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-3">
                  <MapPin size={32} className="text-primary" />
                  <p className="text-sm text-center">CA, Plot 87, near Aster Hospital,<br/>Sadara Mangala Industrial Area, Bengaluru 560048</p>
                  <a href="https://www.google.com/maps/search/Super+Townhouse+Whitefield+Bengaluru" target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
                    Open in Google Maps ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Live contact form */}
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
