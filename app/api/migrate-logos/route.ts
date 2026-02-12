import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';

export async function GET() {
  initializeSchema();
  const db = getDb();

  // Check current logo paths
  const before = db.prepare('SELECT id, name_en, logo FROM manufacturers WHERE logo IS NOT NULL').all() as any[];

  // Update paths
  const updated = db.prepare(`
    UPDATE manufacturers
    SET logo = REPLACE(logo, '/logos/', '/images/brands/')
    WHERE logo LIKE '/logos/%'
  `).run();

  // Check after
  const after = db.prepare('SELECT id, name_en, logo FROM manufacturers WHERE logo IS NOT NULL').all() as any[];

  return NextResponse.json({
    message: `Updated ${updated.changes} logo paths`,
    before: before.map(m => ({ name: m.name_en, logo: m.logo })),
    after: after.map(m => ({ name: m.name_en, logo: m.logo }))
  });
}
