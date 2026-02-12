import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Product, Manufacturer } from '@/lib/types';
import HomeClient from './HomeClient';

function getData() {
  initializeSchema();
  seedDatabase();
  const db = getDb();

  const featuredProducts = db.prepare(`
    SELECT p.*, c.name_en as category_name_en, c.name_ko as category_name_ko,
           t.name_en as type_name_en, t.name_ko as type_name_ko,
           m.name_en as manufacturer_name_en, m.name_ko as manufacturer_name_ko
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
    WHERE p.is_published = 1 AND p.is_featured = 1
    ORDER BY p.created_at DESC LIMIT 4
  `).all() as Product[];

  const manufacturers = db.prepare(`
    SELECT * FROM manufacturers ORDER BY sort_order
  `).all() as Manufacturer[];

  return { featuredProducts, manufacturers };
}

export default function HomePage() {
  const { featuredProducts, manufacturers } = getData();
  return (
    <HomeClient
      featuredProducts={featuredProducts}
      manufacturers={manufacturers}
    />
  );
}
