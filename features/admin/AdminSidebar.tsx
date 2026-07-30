'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, BedDouble, Image,
  Star, Tag, CreditCard, BarChart3, Settings, Globe,
  LogOut, ChevronRight, TrendingUp, Search, Users,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: ROUTES.adminDashboard, icon: LayoutDashboard },
      { label: 'Bookings', href: ROUTES.adminBookings, icon: CalendarDays },
      { label: 'Calendar', href: ROUTES.adminCalendar, icon: CalendarDays },
    ],
  },
  {
    label: 'Hotel',
    items: [
      { label: 'Rooms', href: ROUTES.adminRooms, icon: BedDouble },
      { label: 'Gallery', href: ROUTES.adminGallery, icon: Image },
      { label: 'Reviews', href: ROUTES.adminReviews, icon: Star },
      { label: 'Offers', href: ROUTES.adminOffers, icon: Tag },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Bookings',   href: ROUTES.adminAnalyticsBookings, icon: TrendingUp },
      { label: 'Rooms',      href: ROUTES.adminAnalyticsRooms,    icon: BedDouble },
      { label: 'Guests',     href: ROUTES.adminAnalyticsGuests,   icon: Users },
    ],
  },
  {
    label: 'Finance & Reports',
    items: [
      { label: 'Payments', href: ROUTES.adminPayments, icon: CreditCard },
      { label: 'Reports',  href: ROUTES.adminReports,  icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Global Search', href: ROUTES.adminSearch,   icon: Search },
      { label: 'Website CMS',  href: ROUTES.adminCms,      icon: Globe },
      { label: 'Settings',     href: ROUTES.adminSettings, icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    router.push(ROUTES.login);
    router.refresh();
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
    : 'Staff';

  return (
    <div className="flex flex-col h-full">
      {/* Logo + Admin badge */}
      <div className="p-6 border-b border-white/10">
        <Logo variant="white" size="sm" />
        <p className="text-caption text-white/40 mt-2 ml-10">Admin Console</p>
      </div>

      {/* Staff info */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{profile?.fullName ?? 'Admin'}</p>
          <p className="text-xs text-white/50 truncate">{roleLabel}</p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-6 hide-scrollbar" aria-label="Admin navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-caption text-white/40 uppercase tracking-widest">
              {section.label}
            </p>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-md transition-colors group',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight size={14} aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-label-md text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Sign out of admin"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
