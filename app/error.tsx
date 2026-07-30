'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[Super Townhouse Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-heading font-bold text-[120px] leading-none text-error/10 select-none" aria-hidden="true">
          500
        </div>
        <h1 className="font-heading text-headline-md text-on-surface -mt-4 mb-3">Something Went Wrong</h1>
        <p className="text-body-md text-on-surface-variant mb-8">
          An unexpected error occurred. Our team has been notified. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
          <Link href="/" className="px-6 py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface transition-colors">
            Go to Homepage
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left bg-red-50 border border-red-200 rounded-lg p-4">
            <summary className="text-sm font-semibold text-error cursor-pointer">Error Details (dev only)</summary>
            <pre className="text-xs text-error mt-2 overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
