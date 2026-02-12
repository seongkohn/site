'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from './LanguageProvider';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useLanguage();

  const name = lang === 'en' ? product.name_en : product.name_ko;
  const categoryName = lang === 'en' ? product.category_name_en : product.category_name_ko;
  const manufacturerName = lang === 'en' ? product.manufacturer_name_en : product.manufacturer_name_ko;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-[4/3] relative bg-brand-pale">
        <Image
          src={product.image || '/placeholder-product.svg'}
          alt={name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="p-4">
        {categoryName && (
          <span className="text-xs font-medium text-brand-purple bg-brand-pale px-2 py-0.5 rounded">
            {categoryName}
          </span>
        )}
        <h3 className="mt-2 font-semibold text-brand-navy text-sm leading-tight group-hover:text-brand-magenta transition">
          {name}
        </h3>
        {manufacturerName && (
          <p className="mt-1 text-xs text-gray-500">{manufacturerName}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">SKU: {product.sku}</p>
      </div>
    </Link>
  );
}
