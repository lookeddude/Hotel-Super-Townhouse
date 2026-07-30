/**
 * app/robots.ts
 * Dynamic robots.txt generation via Next.js App Router
 */
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://supertownhouse.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/rooms', '/rooms/', '/gallery', '/about', '/contact', '/facilities', '/faq', '/policies', '/book'],
        disallow: ['/admin', '/dashboard', '/api/', '/auth/', '/_next/', '/login', '/register', '/forgot-password', '/reset-password'],
      },
      // Block known bad bots completely
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
