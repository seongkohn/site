import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Brand } from '@/lib/types';
import PartnersClient from './PartnersClient';

export const metadata = {
  title: 'Partners',
};

function getBrands(): Brand[] {
  initializeSchema();
  seedDatabase();
  const db = getDb();
  return db.prepare('SELECT * FROM brands WHERE is_featured = 1 ORDER BY sort_order').all() as Brand[];
}

export default function PartnersPage() {
  const brands = getBrands();
  return <PartnersClient brands={brands} />;
}
