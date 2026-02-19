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

interface CategoryRow {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  parent_name_en: string | null;
  parent_name_ko: string | null;
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
  `).all() as CategoryRow[];

  const children = db.prepare(`
    SELECT c.*, p.name_en as parent_name_en, p.name_ko as parent_name_ko
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.parent_id IS NOT NULL
    ORDER BY c.sort_order, c.name_en
  `).all() as CategoryRow[];

  // Interleave: parent → child → grandchild
  const categories: CategoryRow[] = [];
  for (const parent of parents) {
    categories.push(parent);
    for (const child of children) {
      if (child.parent_id === parent.id) {
        categories.push(child);
        // Add grandchildren under this child
        for (const grandchild of children) {
          if (grandchild.parent_id === child.id) {
            categories.push(grandchild);
          }
        }
      }
    }
  }
  // Add any orphaned children (parent deleted)
  const listedIds = new Set(categories.map((c) => c.id));
  for (const child of children) {
    if (!listedIds.has(child.id)) {
      categories.push(child);
    }
  }

  return NextResponse.json(categories, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const body = await request.json();

  if (!body.name_en) {
    return NextResponse.json({ error: 'name_en is required' }, { status: 400 });
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
