import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

  db.prepare(`
    UPDATE hero_slides SET title_en = ?, title_ko = ?, subtitle_en = ?, subtitle_ko = ?,
      image = ?, link_url = ?, text_color = ?, text_align = ?, is_active = ?, sort_order = ?
    WHERE id = ?
  `).run(
    body.title_en, body.title_ko,
    body.subtitle_en || null, body.subtitle_ko || null,
    body.image || null, body.link_url || null,
    body.text_color || 'light', body.text_align || 'left',
    body.is_active ?? 1, body.sort_order || 0,
    parseInt(id, 10)
  );

  const updated = db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(parseInt(id, 10));

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

  db.prepare('DELETE FROM hero_slides WHERE id = ?').run(parseInt(id, 10));

  revalidatePath('/', 'layout');

  return NextResponse.json({ success: true });
}
