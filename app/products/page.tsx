import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Product, Category, Type, Brand } from '@/lib/types';
import ProductsClient from './ProductsClient';

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

function getData(searchParams: Record<string, string | undefined>) {
  initializeSchema();
  seedDatabase();
  const db = getDb();

  // Fetch all categories and build parent/child structure
  const allCategories = db.prepare(`
    SELECT * FROM categories ORDER BY sort_order
  `).all() as Category[];

  const parentCategories = allCategories.filter(c => c.parent_id === null);
  const categoriesWithChildren: CategoryWithChildren[] = parentCategories.map(parent => ({
    ...parent,
    children: allCategories.filter(c => c.parent_id === parent.id).map(child => ({
      ...child,
      children: allCategories.filter(c => c.parent_id === child.id).map(gc => ({
        ...gc,
        children: [] as CategoryWithChildren[],
      })),
    })),
  }));

  const types = db.prepare(`
    SELECT * FROM types ORDER BY sort_order
  `).all() as Type[];

  const brands = db.prepare(`
    SELECT * FROM brands ORDER BY sort_order
  `).all() as Brand[];

  // Build initial products query
  const conditions: string[] = ['p.is_published = 1'];
  const params: (string | number)[] = [];

  const categoryId = searchParams.category;
  const typeId = searchParams.type;
  const brandId = searchParams.brand;
  const search = searchParams.search;
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const limit = 12;
  const offset = (page - 1) * limit;

  if (search) {
    const sanitized = search.replace(/[^\w\s가-힣]/g, '').trim();
    if (sanitized) {
      const matchTerms = sanitized.split(/\s+/).map(term => `"${term}"*`).join(' OR ');
      conditions.push(`p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?)`);
      params.push(matchTerms);
    }
  }

  if (categoryId) {
    const catId = parseInt(categoryId, 10);
    conditions.push(`(p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?) OR p.category_id IN (SELECT id FROM categories WHERE parent_id IN (SELECT id FROM categories WHERE parent_id = ?)))`);
    params.push(catId, catId, catId);
  }

  if (typeId) {
    conditions.push('p.type_id = ?');
    params.push(parseInt(typeId, 10));
  }

  if (brandId) {
    conditions.push('p.brand_id = ?');
    params.push(parseInt(brandId, 10));
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM products p ${whereClause}
  `).get(...params) as { total: number };

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
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Product[];

  return {
    categories: categoriesWithChildren,
    types,
    brands,
    products,
    total: countRow.total,
    page,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = getData(resolvedParams);

  return (
    <ProductsClient
      categories={data.categories}
      types={data.types}
      brands={data.brands}
      initialProducts={data.products}
      initialTotal={data.total}
      initialPage={data.page}
      initialTotalPages={data.totalPages}
    />
  );
}
