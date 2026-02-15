import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import slugify from 'slugify';
import type { Product } from '@/lib/types';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['p.is_published = 1'];
    const params: (string | number)[] = [];

    if (search) {
      // Use FTS5 for full-text search
      const ftsQuery = search.replace(/[^\w\s가-힣]/g, '').trim();
      if (ftsQuery) {
        const matchTerms = ftsQuery.split(/\s+/).map(term => `"${term}"*`).join(' OR ');
        conditions.push(`(p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?) OR p.id IN (SELECT DISTINCT product_id FROM product_variants WHERE sku LIKE ?))`);
        params.push(matchTerms, `%${ftsQuery}%`);
      }
    }

    if (category) {
      // Include subcategories: match the category itself or any child category
      conditions.push(`(p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?) OR p.category_id IN (SELECT id FROM categories WHERE parent_id IN (SELECT id FROM categories WHERE parent_id = ?)))`);
      params.push(parseInt(category, 10), parseInt(category, 10), parseInt(category, 10));
    }

    if (type) {
      conditions.push('p.type_id = ?');
      params.push(parseInt(type, 10));
    }

    if (brand) {
      conditions.push('p.brand_id = ?');
      params.push(parseInt(brand, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM products p ${whereClause}
    `).get(...params) as { total: number };
    const total = countRow.total;

    // Get products with joins
    const products = db.prepare(`
      SELECT p.*,
             c.name_en as category_name_en, c.name_ko as category_name_ko,
             t.name_en as type_name_en, t.name_ko as type_name_ko,
             m.name_en as brand_name_en, m.name_ko as brand_name_ko
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN brands m ON p.brand_id = m.id
      ${whereClause}
      ORDER BY p.name_en COLLATE NOCASE ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Product[];

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    ensureDb();
    const db = getDb();
    const body = await request.json();

    const {
      name_en, name_ko, sku, category_id, type_id, brand_id,
      description_en, description_ko, features_en, features_ko,
      detail_en, detail_ko,
      image, is_published, is_featured,
    } = body;

    if (!name_en || !sku) {
      return NextResponse.json({ error: 'name_en and sku are required' }, { status: 400 });
    }

    const slug = body.slug || slugify(name_en, { lower: true, strict: true });

    const result = db.prepare(`
      INSERT INTO products (name_en, name_ko, slug, sku, category_id, type_id, brand_id,
        description_en, description_ko, features_en, features_ko, detail_en, detail_ko,
        image, is_published, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name_en, name_ko, slug, sku,
      category_id || null, type_id || null, brand_id || null,
      description_en || null, description_ko || null,
      features_en || null, features_ko || null,
      detail_en || null, detail_ko || null,
      image || null,
      is_published ?? 1, is_featured ?? 0,
    );

    // Handle related products
    if (body.related_ids && Array.isArray(body.related_ids)) {
      const insertRelated = db.prepare('INSERT INTO product_related (product_id, related_id) VALUES (?, ?)');
      for (const relatedId of body.related_ids) {
        insertRelated.run(result.lastInsertRowid, relatedId);
      }
    }

    // Handle variants
    if (body.variants && Array.isArray(body.variants)) {
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, name_en, name_ko, sku, sort_order) VALUES (?, ?, ?, ?, ?)');
      body.variants.forEach((v: { name_en: string; name_ko: string; sku: string }, i: number) => {
        if (v.name_en && v.sku) {
          insertVariant.run(result.lastInsertRowid, v.name_en, v.name_ko || '', v.sku, i);
        }
      });
    }

    // Handle gallery images
    if (body.images && Array.isArray(body.images)) {
      const newVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id').all(result.lastInsertRowid) as { id: number }[];
      const insertImage = db.prepare(
        'INSERT INTO product_images (product_id, url, type, alt_en, alt_ko, variant_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      body.images.forEach((img: { url: string; type?: string; alt_en?: string; alt_ko?: string; variant_index?: number }, i: number) => {
        if (img.url) {
          const variantId = img.variant_index !== undefined && img.variant_index !== null && img.variant_index >= 0
            ? (newVariants[img.variant_index]?.id ?? null)
            : null;
          insertImage.run(result.lastInsertRowid, img.url, img.type || 'image', img.alt_en || null, img.alt_ko || null, variantId, i);
        }
      });
    }

    // Handle specs
    if (body.specs && Array.isArray(body.specs)) {
      const insertSpec = db.prepare(
        'INSERT INTO product_specs (product_id, key_en, key_ko, value_en, value_ko, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      );
      body.specs.forEach((s: { key_en: string; key_ko: string; value_en: string; value_ko: string }, i: number) => {
        if (s.key_en && s.value_en) {
          insertSpec.run(result.lastInsertRowid, s.key_en, s.key_ko || '', s.value_en, s.value_ko || '', i);
        }
      });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid) as Product;

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
