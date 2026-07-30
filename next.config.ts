import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

// ─── Security Headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    // Content Security Policy
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js HMR in development
      isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://jzcmfpvscdsvkijpgdlj.supabase.co https://images.unsplash.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // TypeScript — enforced (build will fail on TS errors)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jzcmfpvscdsvkijpgdlj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog'],
    // Partial pre-rendering (PPR) — opt-in at page level when needed
    // ppr: 'incremental',
  },

  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Allow framing only on Razorpay checkout
      {
        source: '/api/payments/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },

  // Production redirects
  async redirects() {
    return [
      // Legacy URL cleanup
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/hotel',
        destination: '/about',
        permanent: true,
      },
    ];
  },

  // Powered-by header removal
  poweredByHeader: false,

  // Trailing slash consistency
  trailingSlash: false,

  // Compress output
  compress: true,

  // Output mode — standalone for Vercel/Docker
  // output: 'standalone', // Enable only for Docker deployments
};

export default nextConfig;
