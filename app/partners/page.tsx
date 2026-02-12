import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Manufacturer } from '@/lib/types';
import PartnersClient from './PartnersClient';

export const metadata = {
  title: 'Partners',
};

function getManufacturers(): Manufacturer[] {
  initializeSchema();
  seedDatabase();
  const db = getDb();
  return db.prepare('SELECT * FROM manufacturers ORDER BY sort_order').all() as Manufacturer[];
}

export default function PartnersPage() {
  const manufacturers = getManufacturers();
  return <PartnersClient manufacturers={manufacturers} />;
}
