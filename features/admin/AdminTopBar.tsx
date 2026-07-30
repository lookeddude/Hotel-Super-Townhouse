'use client';

import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/bookings': 'Bookings',
    '/admin/calendar': 'Calendar',
    '/admin/rooms': 'Room Management',
    '/admin/gallery': 'Gallery',
    '/admin/reviews': 'Reviews',
    '/admin/offers': 'Offers & Promotions',
    '/admin/payments': 'Payments',
    '/admin/reports': 'Reports',
    '/admin/cms': 'Website CMS',
    '/admin/settings': 'Settings',
  };
  return map[pathname] ?? 'Admin';
}

export function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    router.push(ROUTES.login);
    router.refresh();
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  return (
    <header
      className="h-16 bg-white border-b border-outline-variant flex items-center px-6 gap-4"
      role="banner"
    >
      {/* Mobile toggle */}
      <button className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Open menu">
        <Menu size={20} className="text-on-surface-variant" />
      </button>

      {/* Title + Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading font-bold text-base text-on-surface leading-none">
          {getPageTitle(pathname)}
        </h1>
        <Breadcrumb className="mt-0.5" />
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface rounded-lg px-3 py-2 w-56">
        <Search size={15} className="text-on-surface-variant flex-shrink-0" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search..."
          className="bg-transparent text-sm text-on-surface placeholder:text-outline outline-none w-full"
          aria-label="Search admin"
        />
      </div>

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg hover:bg-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-on-surface-variant" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" aria-hidden="true" />
      </button>

      {/* Avatar + dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-full bg-inverse-surface flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition-opacity"
          aria-label="Admin menu"
          aria-expanded={menuOpen}
        >
          {initials}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 w-52 bg-white rounded-lg border border-outline-variant shadow-level-3 py-1 z-50">
            <div className="px-4 py-2.5 border-b border-outline-variant">
              <p className="text-sm font-semibold text-on-surface truncate">{profile?.fullName ?? 'Admin'}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
