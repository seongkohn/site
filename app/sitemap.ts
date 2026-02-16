import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { isIndexingEnabled } from '@/lib/site-visibility';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seongkohn.com';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) {
    return [];
  }

  initializeSchema();
  seedDatabase();
  const db = getDb();

  const products = db.prepare(
    "SELECT slug, updated_at FROM products WHERE is_published = 1"
  ).all() as { slug: string; updated_at: string | null }[];

  const categories = db.prepare(
    "SELECT slug FROM categories"
  ).all() as { slug: string }[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/products?category=${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
