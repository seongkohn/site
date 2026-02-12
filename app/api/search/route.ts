import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Product } from '@/lib/types';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();

    const q = request.nextUrl.searchParams.get('q');
    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Sanitize and build FTS5 match expression
    const sanitized = q.replace(/[^\w\s가-힣]/g, '').trim();
    if (!sanitized) {
      return NextResponse.json({ results: [] });
    }

    const matchTerms = sanitized.split(/\s+/).map(term => `"${term}"*`).join(' OR ');

    // Get matching rowids from FTS5 table
    const ftsRows = db.prepare(`
      SELECT rowid, rank FROM products_fts
      WHERE products_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(matchTerms) as { rowid: number; rank: number }[];

    if (ftsRows.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const ids = ftsRows.map(r => r.rowid);
    const placeholders = ids.map(() => '?').join(',');

    const results = db.prepare(`
      SELECT p.*,
             c.name_en as category_name_en, c.name_ko as category_name_ko,
             t.name_en as type_name_en, t.name_ko as type_name_ko,
             m.name_en as manufacturer_name_en, m.name_ko as manufacturer_name_ko
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id IN (${placeholders}) AND p.is_published = 1
    `).all(...ids) as Product[];

    // Preserve FTS rank order
    const orderMap = new Map(ftsRows.map((r, i) => [r.rowid, i]));
    results.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
