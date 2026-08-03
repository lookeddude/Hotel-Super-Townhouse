'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, BedDouble, Image,
  Star, Tag, CreditCard, BarChart3, Settings, Globe,
  LogOut, ChevronRight, TrendingUp, Search, Users, Mail, Activity, Bell, X,
  Wrench, SprayCan,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

// Roles that have full admin access
const FULL_ACCESS   = ['super_admin', 'admin', 'manager'];
const FRONT_DESK    = [...FULL_ACCESS, 'reception'];
const HOUSEKEEPING  = ['super_admin', 'admin', 'manager', 'housekeeping'];
const MAINTENANCE   = ['super_admin', 'admin', 'manager', 'maintenance'];

interface NavItem { label: string; href: string; icon: any; allowedRoles?: string[]; }
interface NavSection { label: string; allowedRoles?: string[]; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operations',
    allowedRoles: FRONT_DESK,
    items: [
      { label: 'Dashboard', href: ROUTES.adminDashboard, icon: LayoutDashboard, allowedRoles: FRONT_DESK },
      { label: 'Bookings',  href: ROUTES.adminBookings,  icon: CalendarDays,    allowedRoles: FRONT_DESK },
      { label: 'Calendar',  href: ROUTES.adminCalendar,  icon: CalendarDays,    allowedRoles: FRONT_DESK },
    ],
  },
  {
    label: 'Hotel',
    allowedRoles: FRONT_DESK,
    items: [
      { label: 'Rooms',    href: ROUTES.adminRooms,    icon: BedDouble, allowedRoles: FRONT_DESK },
      { label: 'Gallery',  href: ROUTES.adminGallery,  icon: Image,     allowedRoles: FULL_ACCESS },
      { label: 'Reviews',  href: ROUTES.adminReviews,  icon: Star,      allowedRoles: FULL_ACCESS },
      { label: 'Offers',   href: ROUTES.adminOffers,   icon: Tag,       allowedRoles: FULL_ACCESS },
    ],
  },
  {
    label: 'Staff Tasks',
    allowedRoles: [...HOUSEKEEPING, ...MAINTENANCE],
    items: [
      { label: '🧹 Housekeeping', href: '/admin/housekeeping', icon: SprayCan, allowedRoles: HOUSEKEEPING },
      { label: '🔧 Maintenance',  href: '/admin/maintenance',  icon: Wrench,   allowedRoles: MAINTENANCE },
    ],
  },
  {
    label: 'Analytics',
    allowedRoles: FULL_ACCESS,
    items: [
      { label: 'Bookings', href: ROUTES.adminAnalyticsBookings, icon: TrendingUp, allowedRoles: FULL_ACCESS },
      { label: 'Rooms',    href: ROUTES.adminAnalyticsRooms,    icon: BedDouble,  allowedRoles: FULL_ACCESS },
      { label: 'Guests',   href: ROUTES.adminAnalyticsGuests,   icon: Users,      allowedRoles: FULL_ACCESS },
    ],
  },
  {
    label: 'Finance & Reports',
    allowedRoles: FULL_ACCESS,
    items: [
      { label: 'Payments', href: ROUTES.adminPayments, icon: CreditCard, allowedRoles: FULL_ACCESS },
      { label: 'Reports',  href: ROUTES.adminReports,  icon: BarChart3,  allowedRoles: FULL_ACCESS },
    ],
  },
  {
    label: 'Communications',
    allowedRoles: FRONT_DESK,
    items: [
      { label: 'Comm. Center',  href: ROUTES.adminCommunications, icon: Mail,     allowedRoles: FULL_ACCESS },
      { label: 'Email Queue',   href: ROUTES.adminEmailQueue,     icon: Mail,     allowedRoles: FULL_ACCESS },
      { label: 'Activity Feed', href: ROUTES.adminActivityFeed,   icon: Activity, allowedRoles: FULL_ACCESS },
      { label: 'Notifications', href: ROUTES.adminNotifications,  icon: Bell,     allowedRoles: FRONT_DESK },
    ],
  },
  {
    label: 'System',
    allowedRoles: FULL_ACCESS,
    items: [
      { label: 'Global Search', href: ROUTES.adminSearch,   icon: Search,   allowedRoles: FULL_ACCESS },
      { label: 'Website CMS',   href: ROUTES.adminCms,      icon: Globe,    allowedRoles: FULL_ACCESS },
      { label: 'Settings',      href: ROUTES.adminSettings, icon: Settings, allowedRoles: ['super_admin', 'admin'] },
    ],
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
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

  // Filter sections and items based on user's role
  const visibleSections = NAV_SECTIONS
    .filter(s => !s.allowedRoles || (role && s.allowedRoles.includes(role)))
    .map(s => ({
      ...s,
      items: s.items.filter(i => !i.allowedRoles || (role && i.allowedRoles.includes(role))),
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Logo + close button row */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <Logo variant="white" size="sm" />
          <p className="text-caption text-white/40 mt-2 ml-10">Admin Console</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
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
        {visibleSections.map((section) => (
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
                      onClick={onClose}
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
