import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Super Townhouse',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-heading font-bold text-[120px] leading-none text-primary/10 select-none" aria-hidden="true">
          404
        </div>
        <h1 className="font-heading text-headline-md text-on-surface -mt-4 mb-3">Page Not Found</h1>
        <p className="text-body-md text-on-surface-variant mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            Go to Homepage
          </Link>
          <Link href="/rooms" className="px-6 py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface transition-colors">
            Browse Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}
