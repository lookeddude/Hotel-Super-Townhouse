import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication Error | Super Townhouse',
  robots: { index: false },
};

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string; description?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error ?? 'unknown_error';
  const description = params.description ?? 'An unexpected authentication error occurred.';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-error/20 p-8 shadow-level-2 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-error" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-headline-md text-on-surface mb-2">
            Authentication Error
          </h1>
          <p className="text-sm text-on-surface-variant mb-2 capitalize">
            {error.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Back to Sign In
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface transition-colors text-sm"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
