import Link from 'next/link';
import { MapPin, Phone, Mail, Share2, ExternalLink, AtSign, Star } from 'lucide-react';
import { Logo } from './Logo';
import { FOOTER_LINKS } from '@/constants/navigation';
import { SITE_CONFIG } from '@/constants/siteConfig';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-inverse-surface text-inverse-on-surface" role="contentinfo">
      {/* Main footer */}
      <div className="container-custom py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">

          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-5">
            <Logo variant="white" />
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              A premium 3-star hotel experience at the heart of ITPL, Whitefield, Bengaluru.
              Comfort meets convenience.
            </p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: SITE_CONFIG.hotel.starRating }).map((_, i) => (
                <Star key={i} size={14} fill="#e31837" className="text-primary" aria-hidden="true" />
              ))}
              <span className="text-sm text-white/70 ml-1">
                {SITE_CONFIG.rating.score} · {SITE_CONFIG.rating.count.toLocaleString('en-IN')} reviews
              </span>
            </div>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Share2 size={16} />
              </a>
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors"
                aria-label="Like us on Facebook"
              >
                <ExternalLink size={16} />
              </a>
              <a
                href={SITE_CONFIG.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <AtSign size={16} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-label-md text-white uppercase tracking-widest">Company</h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rooms Links */}
          <div className="space-y-4">
            <h3 className="text-label-md text-white uppercase tracking-widest">Rooms</h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.rooms.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-label-md text-white uppercase tracking-widest">Contact</h3>
            <ul className="space-y-3" role="list">
              <li>
                <a
                  href={SITE_CONFIG.location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-white transition-colors group"
                  aria-label="Get directions"
                >
                  <MapPin size={15} className="mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span>
                    {SITE_CONFIG.location.address},<br />
                    {SITE_CONFIG.location.city} {SITE_CONFIG.location.pincode}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE_CONFIG.contact.phone}`}
                  className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors group"
                  aria-label={`Call us at ${SITE_CONFIG.contact.phone}`}
                >
                  <Phone size={15} className="group-hover:text-primary transition-colors" />
                  <span>{SITE_CONFIG.contact.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors group"
                  aria-label={`Email us at ${SITE_CONFIG.contact.email}`}
                >
                  <Mail size={15} className="group-hover:text-primary transition-colors" />
                  <span>{SITE_CONFIG.contact.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            © {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-5" role="list">
            {FOOTER_LINKS.policies.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
