import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Faster dev compilation — skip type checking during dev (tsc runs separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Speed up Image handling
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jzcmfpvscdsvkijpgdlj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Suppress the deprecated middleware warning
  experimental: {
    // Enable optimized package imports for heavy libraries
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
