'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage, localize } from './LanguageProvider';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useLanguage();

  const name = localize(lang, product.name_en, product.name_ko);
  const categoryName = localize(lang, product.category_name_en, product.category_name_ko);
  const brandName = localize(lang, product.brand_name_en, product.brand_name_ko);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition h-full flex flex-col"
    >
      <div className="aspect-[4/3] relative bg-white">
        <Image
          src={product.image || '/placeholder-product.svg'}
          alt={name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {categoryName && (
          <span className="self-start text-xs font-medium text-brand-purple bg-brand-pale px-2 py-0.5 rounded">
            {categoryName}
          </span>
        )}
        <h3 className="mt-2 font-semibold text-brand-navy text-sm leading-tight group-hover:text-brand-magenta transition line-clamp-2">
          {name}
        </h3>
        {brandName && (
          <p className="mt-1 text-xs text-gray-500">{brandName}</p>
        )}
      </div>
    </Link>
  );
}
