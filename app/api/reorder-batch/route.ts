import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

const ALLOWED_TABLES = ['categories', 'types', 'brands', 'hero_slides', 'products'] as const;
type TableName = (typeof ALLOWED_TABLES)[number];

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  initializeSchema();
  seedDatabase();
  const db = getDb();

  const body = await request.json();
  const { table, ids } = body as { table: string; ids: number[] };

  if (!ALLOWED_TABLES.includes(table as TableName)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Invalid ids array' }, { status: 400 });
  }

  const column = table === 'products' ? 'featured_order' : 'sort_order';
  const update = db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = ?`);

  db.transaction(() => {
    for (let i = 0; i < ids.length; i++) {
      update.run(i, ids[i]);
    }
  })();

  return NextResponse.json({ success: true });
}
