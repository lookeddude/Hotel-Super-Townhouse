'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Phone, ChevronDown, User, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { PUBLIC_NAV } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
        fetchRole(data.session.user.id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    const roleName = data?.roles?.name ?? '';
    setIsAdmin(['admin', 'super_admin', 'staff', 'manager'].includes(roleName));
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  // isAdmin is set by fetchRole() above

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
          <nav className="flex items-center justify-between h-16 lg:h-18" aria-label="Primary navigation">
            {/* Logo */}
            <Logo />

            {/* Desktop nav */}
            <ul className="hidden lg:flex items-center gap-1" role="list">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href} className="relative">
                  {item.children ? (
                    <div onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)}>
                      <button
                        className={cn(
                          'flex items-center gap-1 px-4 py-2 rounded-lg text-label-md transition-colors',
                          'hover:bg-surface hover:text-on-surface',
                          openDropdown === item.label ? 'text-primary' : 'text-on-surface-variant'
                        )}
                        aria-haspopup="true"
                        aria-expanded={openDropdown === item.label}
                      >
                        {item.label}
                        <ChevronDown size={14} className={cn('transition-transform duration-200', openDropdown === item.label ? 'rotate-180' : '')} />
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
                              <Link key={child.href} href={child.href} className="block px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors" role="menuitem">
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
                        pathname === item.href ? 'text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
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

              {/* Book Now button */}
              <Link
                href={ROUTES.rooms}
                className="px-5 py-2.5 bg-primary text-white text-label-md rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                Book Now
              </Link>

              {/* Auth: Sign In OR Profile Avatar */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-outline-variant hover:border-primary hover:bg-surface transition-all"
                    aria-label="Profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <span className="text-sm font-medium text-on-surface max-w-[80px] truncate">
                      {profile?.full_name?.split(' ')[0] ?? 'Profile'}
                    </span>
                    <ChevronDown size={13} className={cn('text-on-surface-variant transition-transform', profileOpen ? 'rotate-180' : '')} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-outline-variant">
                          <p className="text-sm font-semibold text-on-surface truncate">{profile?.full_name ?? 'Guest'}</p>
                          <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface transition-colors">
                            <LayoutDashboard size={15} className="text-on-surface-variant" /> My Dashboard
                          </Link>
                          <Link href="/dashboard/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface transition-colors">
                            <CalendarCheck size={15} className="text-on-surface-variant" /> My Bookings
                          </Link>
                          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface transition-colors">
                            <User size={15} className="text-on-surface-variant" /> Edit Profile
                          </Link>
                          {isAdmin && (
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-medium hover:bg-surface transition-colors">
                              <LayoutDashboard size={15} /> Admin Panel
                            </Link>
                          )}
                        </div>

                        {/* Sign out */}
                        <div className="border-t border-outline-variant py-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={ROUTES.login}
                  className="px-4 py-2 text-label-md text-on-surface border border-outline-variant rounded-lg hover:bg-surface transition-colors"
                >
                  Sign In
                </Link>
              )}
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
                      pathname === item.href ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface hover:bg-surface'
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((child) => (
                    <Link key={child.href} href={child.href} className="block pl-8 pr-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface rounded-lg transition-colors">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{profile?.full_name ?? 'Guest'}</p>
                        <p className="text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-on-surface hover:bg-surface rounded-lg">My Dashboard</Link>
                    <Link href="/dashboard/bookings" className="block px-4 py-2.5 text-sm text-on-surface hover:bg-surface rounded-lg">My Bookings</Link>
                    {isAdmin && <Link href="/admin" className="block px-4 py-2.5 text-sm text-primary font-medium hover:bg-surface rounded-lg">Admin Panel</Link>}
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-red-50 rounded-lg">Sign Out</button>
                  </>
                ) : (
                  <Link href={ROUTES.login} className="block w-full text-center px-4 py-2.5 border border-outline-variant rounded-lg text-label-md text-on-surface hover:bg-surface transition-colors">
                    Sign In
                  </Link>
                )}
                <Link href={ROUTES.rooms} className="block w-full text-center px-4 py-2.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-dark transition-colors">
                  Book Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Spacer */}
      <div className="h-16 lg:h-16" aria-hidden="true" />
    </>
  );
}
