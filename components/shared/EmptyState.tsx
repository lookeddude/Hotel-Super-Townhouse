import { type LucideIcon, CalendarX, BedDouble, Star, Image, Bell, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
        <Icon size={28} className="text-outline" aria-hidden="true" />
      </div>
      <h3 className="font-heading font-semibold text-headline-md text-on-surface mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-body-md text-on-surface-variant max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Pre-built Variants ───────────────────────────────────────────────────────

export function NoBookings({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={CalendarX}
      title="No bookings yet"
      description="You haven't made any reservations. Start by exploring our rooms and suites."
      action={action}
    />
  );
}

export function NoRooms({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={BedDouble}
      title="No rooms found"
      description="Try adjusting your filters or search criteria to find available rooms."
      action={action}
    />
  );
}

export function NoReviews() {
  return (
    <EmptyState
      icon={Star}
      title="No reviews yet"
      description="Be the first to share your experience at Super Townhouse."
    />
  );
}

export function NoGallery() {
  return (
    <EmptyState
      icon={Image}
      title="Gallery coming soon"
      description="We're uploading photos of our beautiful property. Check back soon."
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="All caught up!"
      description="You have no new notifications at this time."
    />
  );
}
