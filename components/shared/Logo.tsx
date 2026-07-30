import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface LogoProps {
  variant?: 'default' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ variant = 'default', size = 'md' }: LogoProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-on-surface';
  const accentColor = variant === 'white' ? 'text-red-300' : 'text-primary';

  return (
    <Link
      href={ROUTES.home}
      className={`inline-flex items-center gap-2 font-heading font-bold ${sizeMap[size]} ${textColor} hover:opacity-80 transition-opacity`}
      aria-label="Super Townhouse — Go to homepage"
    >
      {/* Brand mark */}
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm flex-shrink-0`}
        aria-hidden="true"
      >
        ST
      </span>
      <span>
        Super{' '}
        <span className={accentColor}>Townhouse</span>
      </span>
    </Link>
  );
}
