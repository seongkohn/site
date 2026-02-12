import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET() {
  ensureDb();
  const db = getDb();

  // Get parents sorted, then children sorted under each parent
  const parents = db.prepare(`
    SELECT c.*, NULL as parent_name_en, NULL as parent_name_ko
    FROM categories c
    WHERE c.parent_id IS NULL
    ORDER BY c.sort_order, c.name_en
  `).all() as any[];

  const children = db.prepare(`
    SELECT c.*, p.name_en as parent_name_en, p.name_ko as parent_name_ko
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.parent_id IS NOT NULL
    ORDER BY c.sort_order, c.name_en
  `).all() as any[];

  // Interleave: each parent followed by its children
  const categories: any[] = [];
  for (const parent of parents) {
    categories.push(parent);
    for (const child of children) {
      if (child.parent_id === parent.id) {
        categories.push(child);
      }
    }
  }
  // Add any orphaned children (parent deleted)
  for (const child of children) {
    if (!parents.some((p) => p.id === child.parent_id)) {
      categories.push(child);
    }
  }

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const body = await request.json();

  if (!body.name_en || !body.name_ko) {
    return NextResponse.json({ error: 'name_en and name_ko are required' }, { status: 400 });
  }

  const slug = slugify(body.name_en, { lower: true, strict: true });

  const result = db.prepare(`
    INSERT INTO categories (name_en, name_ko, slug, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(body.name_en, body.name_ko, slug, body.parent_id || null, body.sort_order || 0);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

  // Revalidate to refresh SearchBar and other components
  revalidatePath('/', 'layout');

  return NextResponse.json(category, { status: 201 });
}
