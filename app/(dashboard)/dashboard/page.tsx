import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { CalendarDays, BedDouble, Star, Clock } from 'lucide-react';
import { NoBookings } from '@/components/shared/EmptyState';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = createMetadata({ title: 'My Dashboard', noIndex: true });

const STATS = [
  { label: 'Total Stays', value: '0', icon: BedDouble, color: 'text-primary' },
  { label: 'Upcoming', value: '0', icon: CalendarDays, color: 'text-blue-600' },
  { label: 'Reviews Given', value: '0', icon: Star, color: 'text-yellow-500' },
  { label: 'Loyalty Points', value: '0', icon: Clock, color: 'text-green-600' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-headline-md text-on-surface">Welcome back 👋</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Here's an overview of your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-outline-variant p-5">
              <Icon size={20} className={stat.color} aria-hidden="true" />
              <p className="font-heading font-bold text-3xl text-on-surface mt-3">{stat.value}</p>
              <p className="text-sm text-on-surface-variant mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-outline-variant">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h2 className="font-heading font-semibold text-base text-on-surface">Recent Bookings</h2>
          <Link href={ROUTES.dashboardBookings} className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <NoBookings
          action={
            <Link href={ROUTES.rooms} className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-dark transition-colors">
              Browse Rooms
            </Link>
          }
        />
      </div>
    </div>
  );
}
