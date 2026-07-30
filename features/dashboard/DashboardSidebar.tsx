'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, User, Bell, LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { label: 'Overview', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'My Bookings', href: ROUTES.dashboardBookings, icon: CalendarDays },
  { label: 'Profile', href: ROUTES.dashboardProfile, icon: User },
  { label: 'Notifications', href: ROUTES.dashboardNotifications, icon: Bell },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('You have been signed out.');
    router.push(ROUTES.login);
    router.refresh();
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'G';

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
    : 'Customer';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-outline-variant">
        <Logo size="sm" />
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-outline-variant flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">
            {profile?.fullName ?? 'Guest'}
          </p>
          <p className="text-xs text-on-surface-variant truncate">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-md transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-outline-variant">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-label-md text-on-surface-variant hover:bg-red-50 hover:text-error transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
