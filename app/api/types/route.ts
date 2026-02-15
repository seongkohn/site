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

  const types = db.prepare('SELECT * FROM types ORDER BY sort_order, name_en').all();
  return NextResponse.json(types);
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
    INSERT INTO types (name_en, name_ko, slug, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(body.name_en, body.name_ko, slug, body.sort_order || 0);

  const type = db.prepare('SELECT * FROM types WHERE id = ?').get(result.lastInsertRowid);

  // Revalidate to refresh SearchBar and other components
  revalidatePath('/', 'layout');

  return NextResponse.json(type, { status: 201 });
}
