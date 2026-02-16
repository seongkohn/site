import type { MetadataRoute } from 'next';
import { isIndexingEnabled } from '@/lib/site-visibility';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seongkohn.com';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
