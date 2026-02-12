import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { getAdminUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';

export async function POST(req: Request) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initializeSchema();
    const db = getDb();

    const body = await req.json();
    const products = body.products || [];

    if (!Array.isArray(products) || products.length === 0) {
      return Response.json({ error: 'No products to import' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const { name_en, name_ko, sku, category_id, type_id, manufacturer_id, description_en, description_ko, is_published } = product;

      if (!name_en || !sku) {
        errors.push(`Row ${i + 1}: missing name_en or sku, skipped`);
        continue;
      }

      try {
        const slug = slugify(name_en, { lower: true, strict: true });
        const existing = db
          .prepare('SELECT id FROM products WHERE sku = ?')
          .get(sku) as { id: number } | undefined;

        if (existing) {
          db.prepare(`
            UPDATE products
            SET name_en = ?, name_ko = ?, slug = ?, category_id = ?, type_id = ?, manufacturer_id = ?,
                description_en = ?, description_ko = ?, is_published = ?
            WHERE sku = ?
          `).run(
            name_en,
            name_ko || null,
            slug,
            category_id ? parseInt(category_id) : null,
            type_id ? parseInt(type_id) : null,
            manufacturer_id ? parseInt(manufacturer_id) : null,
            description_en || null,
            description_ko || null,
            is_published === '0' || is_published === 'false' ? 0 : 1,
            sku
          );
          updated++;
        } else {
          db.prepare(`
            INSERT INTO products (name_en, name_ko, slug, sku, category_id, type_id, manufacturer_id, description_en, description_ko, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            name_en,
            name_ko || null,
            slug,
            sku,
            category_id ? parseInt(category_id) : null,
            type_id ? parseInt(type_id) : null,
            manufacturer_id ? parseInt(manufacturer_id) : null,
            description_en || null,
            description_ko || null,
            is_published === '0' || is_published === 'false' ? 0 : 1
          );
          created++;
        }
      } catch (err) {
        errors.push(`Row ${i + 1} (${sku}): ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    // Revalidate all pages that might display products or use categories/types
    revalidatePath('/', 'layout'); // Revalidates entire app including SearchBar
    revalidatePath('/products');
    revalidatePath('/');

    return Response.json({ created, updated, errors });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}
