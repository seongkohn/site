import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';
import slugify from 'slugify';
import type { Product, Variant, ProductImage, ProductSpec } from '@/lib/types';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDb();
    const db = getDb();
    const { id } = await params;

    const product = db.prepare(`
      SELECT p.*,
             c.name_en as category_name_en, c.name_ko as category_name_ko,
             t.name_en as type_name_en, t.name_ko as type_name_ko,
             m.name_en as brand_name_en, m.name_ko as brand_name_ko
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN brands m ON p.brand_id = m.id
      WHERE p.id = ?
    `).get(parseInt(id, 10)) as Product | undefined;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get related product IDs
    const relatedRows = db.prepare('SELECT related_id FROM product_related WHERE product_id = ?').all(parseInt(id, 10)) as { related_id: number }[];
    const related_ids = relatedRows.map(r => r.related_id);

    // Get variants
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id').all(parseInt(id, 10)) as Variant[];

    // Get gallery images
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id').all(parseInt(id, 10)) as ProductImage[];

    // Get specs
    const specs = db.prepare('SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order, id').all(parseInt(id, 10)) as ProductSpec[];

    return NextResponse.json({ product, related_ids, variants, images, specs });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    ensureDb();
    const db = getDb();
    const { id } = await params;
    const productId = parseInt(id, 10);
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Product | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const {
      name_en, name_ko, sku, category_id, type_id, brand_id,
      description_en, description_ko, features_en, features_ko,
      detail_en, detail_ko,
      image, is_published, is_featured,
    } = body;

    const slug = body.slug || (name_en ? slugify(name_en, { lower: true, strict: true }) : existing.slug);

    db.prepare(`
      UPDATE products SET
        name_en = ?, name_ko = ?, slug = ?, sku = ?,
        category_id = ?, type_id = ?, brand_id = ?,
        description_en = ?, description_ko = ?,
        features_en = ?, features_ko = ?,
        detail_en = ?, detail_ko = ?,
        image = ?, is_published = ?, is_featured = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name_en ?? existing.name_en,
      name_ko ?? existing.name_ko,
      slug,
      sku ?? existing.sku,
      category_id !== undefined ? (category_id || null) : existing.category_id,
      type_id !== undefined ? (type_id || null) : existing.type_id,
      brand_id !== undefined ? (brand_id || null) : existing.brand_id,
      description_en !== undefined ? (description_en || null) : existing.description_en,
      description_ko !== undefined ? (description_ko || null) : existing.description_ko,
      features_en !== undefined ? (features_en || null) : existing.features_en,
      features_ko !== undefined ? (features_ko || null) : existing.features_ko,
      detail_en !== undefined ? (detail_en || null) : existing.detail_en,
      detail_ko !== undefined ? (detail_ko || null) : existing.detail_ko,
      image !== undefined ? (image || null) : existing.image,
      is_published ?? existing.is_published,
      is_featured ?? existing.is_featured,
      productId,
    );

    // Handle related products
    if (body.related_ids !== undefined && Array.isArray(body.related_ids)) {
      db.prepare('DELETE FROM product_related WHERE product_id = ?').run(productId);
      const insertRelated = db.prepare('INSERT INTO product_related (product_id, related_id) VALUES (?, ?)');
      for (const relatedId of body.related_ids) {
        insertRelated.run(productId, relatedId);
      }
    }

    // Handle variants
    if (body.variants !== undefined && Array.isArray(body.variants)) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, name_en, name_ko, sku, sort_order) VALUES (?, ?, ?, ?, ?)');
      body.variants.forEach((v: { name_en: string; name_ko: string; sku: string }, i: number) => {
        if (v.name_en && v.sku) {
          insertVariant.run(productId, v.name_en, v.name_ko || '', v.sku, i);
        }
      });
    }

    // Handle gallery images
    if (body.images !== undefined && Array.isArray(body.images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);

      // Re-fetch variants to map variant indices to new IDs
      const newVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id').all(productId) as Variant[];

      const insertImage = db.prepare(
        'INSERT INTO product_images (product_id, url, type, alt_en, alt_ko, variant_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      body.images.forEach((img: { url: string; type?: string; alt_en?: string; alt_ko?: string; variant_index?: number }, i: number) => {
        if (img.url) {
          const variantId = img.variant_index !== undefined && img.variant_index !== null && img.variant_index >= 0
            ? (newVariants[img.variant_index]?.id ?? null)
            : null;
          insertImage.run(productId, img.url, img.type || 'image', img.alt_en || null, img.alt_ko || null, variantId, i);
        }
      });
    }

    // Handle specs
    if (body.specs !== undefined && Array.isArray(body.specs)) {
      db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(productId);
      const insertSpec = db.prepare(
        'INSERT INTO product_specs (product_id, key_en, key_ko, value_en, value_ko, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      );
      body.specs.forEach((s: { key_en: string; key_ko: string; value_en: string; value_ko: string }, i: number) => {
        if (s.key_en && s.value_en) {
          insertSpec.run(productId, s.key_en, s.key_ko || '', s.value_en, s.value_ko || '', i);
        }
      });
    }

    const updated = db.prepare(`
      SELECT p.*,
             c.name_en as category_name_en, c.name_ko as category_name_ko,
             t.name_en as type_name_en, t.name_ko as type_name_ko,
             m.name_en as brand_name_en, m.name_ko as brand_name_ko
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN brands m ON p.brand_id = m.id
      WHERE p.id = ?
    `).get(productId) as Product;

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    ensureDb();
    const db = getDb();
    const { id } = await params;
    const productId = parseInt(id, 10);

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
