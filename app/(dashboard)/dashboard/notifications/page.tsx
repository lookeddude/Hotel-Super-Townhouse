import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { NoNotifications } from '@/components/shared/EmptyState';

export const metadata: Metadata = createMetadata({ title: 'Notifications', noIndex: true });

export default function DashboardNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Notifications</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Stay updated on your bookings and offers</p>
        </div>
        <button className="text-sm text-primary hover:underline">Mark all as read</button>
      </div>
      <div className="bg-white rounded-lg border border-outline-variant">
        <NoNotifications />
      </div>
    </div>
  );
}
