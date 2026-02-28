import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import { sanitizePublicUrl } from '@/lib/url-safety';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET() {
  ensureDb();
  const db = getDb();

  const brands = db.prepare('SELECT * FROM brands ORDER BY sort_order, name_en').all();
  return NextResponse.json(brands, {
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

  const website = sanitizePublicUrl(body.website, { allowRelative: false });
  if (body.website && !website) {
    return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
  }

  const slug = slugify(body.name_en, { lower: true, strict: true });

  const result = db.prepare(`
    INSERT INTO brands (name_en, name_ko, slug, logo, website, description_en, description_ko, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.name_en, body.name_ko, slug,
    body.logo || null, website,
    body.description_en || null, body.description_ko || null,
    body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : 1,
    body.sort_order || 0
  );

  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);

  revalidatePath('/', 'layout');

  return NextResponse.json(brand, { status: 201 });
}
