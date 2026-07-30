import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/siteConfig';

interface MetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  canonical?: string;
}

/**
 * Factory function for generating consistent page metadata.
 * Used in each page's generateMetadata() export.
 */
export function createMetadata({
  title,
  description,
  keywords = [],
  ogImage,
  noIndex = false,
  canonical,
}: MetadataOptions = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`;

  const pageDescription = description ?? SITE_CONFIG.description;
  const pageOgImage = ogImage ?? SITE_CONFIG.seo.ogImage;
  const allKeywords = [...SITE_CONFIG.seo.keywords, ...keywords];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: allKeywords.join(', '),
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical ?? SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: pageOgImage,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.seo.twitterHandle,
      title: pageTitle,
      description: pageDescription,
      images: [pageOgImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}
