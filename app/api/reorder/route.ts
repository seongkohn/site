import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

const ALLOWED_TABLES = ['categories', 'types', 'brands', 'hero_slides'] as const;
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
  const { table, id, direction } = body as {
    table: string;
    id: number;
    direction: 'up' | 'down';
  };

  if (!ALLOWED_TABLES.includes(table as TableName)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  if (!id || !['up', 'down'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  // For categories, we need to reorder within the same parent level
  if (table === 'categories') {
    const current = db
      .prepare('SELECT id, parent_id, sort_order FROM categories WHERE id = ?')
      .get(id) as { id: number; parent_id: number | null; sort_order: number } | undefined;

    if (!current) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get siblings (same parent_id)
    const siblings = db
      .prepare(
        current.parent_id
          ? 'SELECT id, sort_order FROM categories WHERE parent_id = ? ORDER BY sort_order, id'
          : 'SELECT id, sort_order FROM categories WHERE parent_id IS NULL ORDER BY sort_order, id'
      )
      .all(...(current.parent_id ? [current.parent_id] : [])) as { id: number; sort_order: number }[];

    const currentIndex = siblings.findIndex((item) => item.id === id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= siblings.length) {
      return NextResponse.json({ success: true });
    }

    const swap = siblings[swapIndex];
    let newCurrentOrder = swap.sort_order;
    let newSwapOrder = current.sort_order;

    if (newCurrentOrder === newSwapOrder) {
      newCurrentOrder = swapIndex;
      newSwapOrder = currentIndex;
    }

    const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      update.run(newCurrentOrder, current.id);
      update.run(newSwapOrder, swap.id);
    })();

    return NextResponse.json({ success: true });
  }

  // For flat tables (types, manufacturers) — simple swap
  const items = db
    .prepare(`SELECT id, sort_order FROM ${table} ORDER BY sort_order, id`)
    .all() as { id: number; sort_order: number }[];

  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex === -1) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= items.length) {
    return NextResponse.json({ success: true });
  }

  const current = items[currentIndex];
  const swap = items[swapIndex];

  let newCurrentOrder = swap.sort_order;
  let newSwapOrder = current.sort_order;

  if (newCurrentOrder === newSwapOrder) {
    newCurrentOrder = swapIndex;
    newSwapOrder = currentIndex;
  }

  const update = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
  db.transaction(() => {
    update.run(newCurrentOrder, current.id);
    update.run(newSwapOrder, swap.id);
  })();

  return NextResponse.json({ success: true });
}
