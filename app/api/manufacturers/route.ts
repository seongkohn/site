import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import slugify from 'slugify';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET() {
  ensureDb();
  const db = getDb();

  const manufacturers = db.prepare('SELECT * FROM manufacturers ORDER BY sort_order, name_en').all();
  return NextResponse.json(manufacturers);
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
    INSERT INTO manufacturers (name_en, name_ko, slug, logo, website, description_en, description_ko, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.name_en, body.name_ko, slug,
    body.logo || null, body.website || null,
    body.description_en || null, body.description_ko || null,
    body.sort_order || 0
  );

  const manufacturer = db.prepare('SELECT * FROM manufacturers WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(manufacturer, { status: 201 });
}
