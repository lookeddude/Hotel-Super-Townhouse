'use client';

import { useRouter } from 'next/navigation';
import { Bell, Menu, LogOut, User } from 'lucide-react';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function DashboardHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out.');
      router.push(ROUTES.login);
      router.refresh();
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'G';

  return (
    <header
      className="h-16 bg-white border-b border-outline-variant flex items-center px-6 gap-4"
      role="banner"
    >
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} className="text-on-surface-variant" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <Breadcrumb />
      </div>

      {/* Notifications */}
      <Link
        href={ROUTES.dashboardNotifications}
        className="relative p-2 rounded-lg hover:bg-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-on-surface-variant" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
      </Link>

      {/* User avatar + dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          aria-label="User menu"
          aria-expanded={menuOpen}
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-52 bg-white rounded-lg border border-outline-variant shadow-level-3 py-1 z-50">
            {/* User info */}
            <div className="px-4 py-2.5 border-b border-outline-variant">
              <p className="text-sm font-semibold text-on-surface truncate">
                {profile?.fullName ?? 'Guest'}
              </p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>

            <Link
              href={ROUTES.dashboardProfile}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors"
            >
              <User size={16} />
              My Profile
            </Link>

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
