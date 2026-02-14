import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import type { Product, Variant, ProductImage, ProductSpec } from '@/lib/types';
import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

function getProduct(slug: string) {
  initializeSchema();
  seedDatabase();
  const db = getDb();

  const product = db.prepare(`
    SELECT p.*,
           c.name_en as category_name_en, c.name_ko as category_name_ko,
           t.name_en as type_name_en, t.name_ko as type_name_ko,
           m.name_en as brand_name_en, m.name_ko as brand_name_ko
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN brands m ON p.brand_id = m.id
    WHERE p.slug = ? AND p.is_published = 1
  `).get(slug) as Product | undefined;

  if (!product) return null;

  // Fetch related products via the product_related join table
  const relatedProducts = db.prepare(`
    SELECT p.*,
           c.name_en as category_name_en, c.name_ko as category_name_ko,
           t.name_en as type_name_en, t.name_ko as type_name_ko,
           m.name_en as brand_name_en, m.name_ko as brand_name_ko
    FROM product_related pr
    JOIN products p ON pr.related_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN brands m ON p.brand_id = m.id
    WHERE pr.product_id = ? AND p.is_published = 1
  `).all(product.id) as Product[];

  const variants = db.prepare(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id'
  ).all(product.id) as Variant[];

  const images = db.prepare(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id'
  ).all(product.id) as ProductImage[];

  const specs = db.prepare(
    'SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order, id'
  ).all(product.id) as ProductSpec[];

  return { product, relatedProducts, variants, images, specs };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  initializeSchema();
  seedDatabase();
  const db = getDb();

  const product = db.prepare(`
    SELECT name_en, name_ko, description_en, description_ko, image FROM products WHERE slug = ?
  `).get(slug) as Pick<Product, 'name_en' | 'name_ko' | 'description_en' | 'description_ko' | 'image'> | undefined;

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name_en} | Seongkohn Traders`,
    description: product.description_en || `${product.name_en} - Available from Seongkohn Traders Corp.`,
    openGraph: {
      title: product.name_en,
      description: product.description_en || undefined,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getProduct(slug);

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={data.product}
      relatedProducts={data.relatedProducts}
      variants={data.variants}
      images={data.images}
      specs={data.specs}
    />
  );
}
