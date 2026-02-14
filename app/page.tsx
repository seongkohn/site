import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Product, Brand, HeroSlide } from '@/lib/types';
import HomeClient from './HomeClient';

function getData() {
  initializeSchema();
  seedDatabase();
  const db = getDb();

  const featuredProducts = db.prepare(`
    SELECT p.*, c.name_en as category_name_en, c.name_ko as category_name_ko,
           t.name_en as type_name_en, t.name_ko as type_name_ko,
           m.name_en as brand_name_en, m.name_ko as brand_name_ko
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN brands m ON p.brand_id = m.id
    WHERE p.is_published = 1 AND p.is_featured = 1
    ORDER BY p.created_at DESC LIMIT 4
  `).all() as Product[];

  const brands = db.prepare(`
    SELECT * FROM brands WHERE is_featured = 1 ORDER BY sort_order
  `).all() as Brand[];

  const heroSlides = db.prepare(`
    SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order, id
  `).all() as HeroSlide[];

  return { featuredProducts, brands, heroSlides };
}

export default function HomePage() {
  const { featuredProducts, brands, heroSlides } = getData();
  return (
    <HomeClient
      featuredProducts={featuredProducts}
      brands={brands}
      heroSlides={heroSlides}
    />
  );
}
