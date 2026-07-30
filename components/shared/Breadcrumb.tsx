'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function useAutoBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((segment, index) => ({
    label: toTitleCase(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
  }));
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const autoCrumbs = useAutoBreadcrumb();
  const crumbs = items ?? autoCrumbs;

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-caption text-on-surface-variant', className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap" role="list">
        {/* Home */}
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            aria-label="Home"
          >
            <Home size={12} aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href ?? crumb.label} className="flex items-center gap-1.5">
              <ChevronRight size={12} aria-hidden="true" className="text-outline" />
              {isLast || !crumb.href ? (
                <span className={cn('font-medium', isLast ? 'text-on-surface' : '')}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
