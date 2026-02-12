import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();

  const leads = db.prepare(`
    SELECT l.*, p.name_en as product_name_en
    FROM leads l
    LEFT JOIN products p ON l.product_id = p.id
    ORDER BY l.created_at DESC
  `).all();

  return NextResponse.json(leads);
}
