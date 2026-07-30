'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { PUBLIC_NAV } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-level-2 border-b border-outline-variant'
            : 'bg-white'
        )}
        role="banner"
      >
        <div className="container-custom">
          <nav
            className="flex items-center justify-between h-16 lg:h-18"
            aria-label="Primary navigation"
          >
            {/* Logo */}
            <Logo />

            {/* Desktop nav */}
            <ul className="hidden lg:flex items-center gap-1" role="list">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href} className="relative">
                  {item.children ? (
                    <div
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={cn(
                          'flex items-center gap-1 px-4 py-2 rounded-lg text-label-md transition-colors',
                          'hover:bg-surface hover:text-on-surface',
                          openDropdown === item.label
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        )}
                        aria-haspopup="true"
                        aria-expanded={openDropdown === item.label}
                      >
                        {item.label}
                        <ChevronDown
                          size={14}
                          className={cn(
                            'transition-transform duration-200',
                            openDropdown === item.label ? 'rotate-180' : ''
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {openDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-level-3 border border-outline-variant overflow-hidden"
                            role="menu"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className="block px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors"
                                role="menuitem"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-4 py-2 rounded-lg text-label-md transition-colors',
                        pathname === item.href
                          ? 'text-primary font-semibold'
                          : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={`tel:${SITE_CONFIG.contact.phone}`}
                className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary transition-colors"
                aria-label={`Call us at ${SITE_CONFIG.contact.phone}`}
              >
                <Phone size={15} />
                <span>{SITE_CONFIG.contact.phone}</span>
              </a>
              <Link
                href={ROUTES.login}
                className="px-4 py-2 text-label-md text-on-surface border border-outline-variant rounded-lg hover:bg-surface transition-colors"
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.rooms}
                className="px-5 py-2.5 bg-primary text-white text-label-md rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-white border-b border-outline-variant shadow-level-3 lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="container-custom py-4 space-y-1">
              {PUBLIC_NAV.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-4 py-3 rounded-lg text-body-md transition-colors',
                      pathname === item.href
                        ? 'bg-primary/5 text-primary font-semibold'
                        : 'text-on-surface hover:bg-surface'
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block pl-8 pr-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface rounded-lg transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
                <Link
                  href={ROUTES.login}
                  className="block w-full text-center px-4 py-2.5 border border-outline-variant rounded-lg text-label-md text-on-surface hover:bg-surface transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href={ROUTES.rooms}
                  className="block w-full text-center px-4 py-2.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-dark transition-colors"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-16" aria-hidden="true" />
    </>
  );
}
