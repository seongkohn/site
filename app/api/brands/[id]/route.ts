import { NextResponse } from 'next/server';
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const { id } = await params;
  const body = await request.json();

  const slug = body.name_en ? slugify(body.name_en, { lower: true, strict: true }) : undefined;

  db.prepare(`
    UPDATE brands SET
      name_en = ?, name_ko = ?, slug = ?, logo = ?, website = ?,
      description_en = ?, description_ko = ?, is_featured = ?, sort_order = ?
    WHERE id = ?
  `).run(
    body.name_en, body.name_ko, slug || body.slug,
    body.logo || null, body.website || null,
    body.description_en || null, body.description_ko || null,
    body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : 1,
    body.sort_order || 0,
    parseInt(id, 10)
  );

  const updated = db.prepare('SELECT * FROM brands WHERE id = ?').get(parseInt(id, 10));

  revalidatePath('/', 'layout');

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const { id } = await params;

  db.prepare('DELETE FROM brands WHERE id = ?').run(parseInt(id, 10));

  revalidatePath('/', 'layout');

  return NextResponse.json({ success: true });
}
