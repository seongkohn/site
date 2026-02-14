import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET(request: NextRequest) {
  ensureDb();
  const db = getDb();

  const adminOnly = request.nextUrl.searchParams.get('all') === '1';

  if (adminOnly) {
    const slides = db.prepare('SELECT * FROM hero_slides ORDER BY sort_order, id').all();
    return NextResponse.json(slides);
  }

  const slides = db.prepare('SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order, id').all();
  return NextResponse.json(slides);
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const body = await request.json();

  if (!body.title_en || !body.title_ko) {
    return NextResponse.json({ error: 'title_en and title_ko are required' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO hero_slides (title_en, title_ko, subtitle_en, subtitle_ko, image, link_url, text_color, text_align, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.title_en, body.title_ko,
    body.subtitle_en || null, body.subtitle_ko || null,
    body.image || null, body.link_url || null,
    body.text_color || 'light', body.text_align || 'left',
    body.is_active ?? 1, body.sort_order || 0
  );

  const slide = db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(result.lastInsertRowid);

  revalidatePath('/', 'layout');

  return NextResponse.json(slide, { status: 201 });
}
