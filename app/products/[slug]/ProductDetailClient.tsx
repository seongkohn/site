'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: Props) {
  const { lang } = useLanguage();

  const name = lang === 'en' ? product.name_en : product.name_ko;
  const description = lang === 'en' ? product.description_en : product.description_ko;
  const featuresRaw = lang === 'en' ? product.features_en : product.features_ko;
  const features = featuresRaw ? featuresRaw.split('\n').filter(Boolean) : [];
  const categoryName = lang === 'en' ? product.category_name_en : product.category_name_ko;
  const typeName = lang === 'en' ? product.type_name_en : product.type_name_ko;
  const manufacturerName = lang === 'en' ? product.manufacturer_name_en : product.manufacturer_name_ko;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: t('products.title', lang), href: '/products' },
          { label: name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left: Product Image */}
        <div className="bg-brand-pale rounded-xl flex items-center justify-center aspect-square relative overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="mt-2 text-sm">No image available</span>
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {typeName && (
              <span className="text-xs font-medium text-white bg-brand-purple px-2.5 py-1 rounded-full">
                {typeName}
              </span>
            )}
            {categoryName && (
              <span className="text-xs font-medium text-brand-purple bg-brand-pale px-2.5 py-1 rounded-full">
                {categoryName}
              </span>
            )}
          </div>

          {/* Product name */}
          <h1
            className="text-2xl lg:text-3xl font-bold text-brand-navy mb-2"          >
            {name}
          </h1>

          {/* Manufacturer + SKU */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
            {manufacturerName && (
              <span className="font-medium text-brand-navy">{manufacturerName}</span>
            )}
            <span className="text-gray-300">|</span>
            <span>{t('products.sku', lang)}: {product.sku}</span>
          </div>

          {/* Description */}
          {description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t('products.description', lang)}
              </h2>
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('products.keyFeatures', lang)}
              </h2>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-brand-magenta shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Request a Quote button */}
          <Link
            href={`/contact?product=${product.id}`}
            className="inline-flex items-center gap-2 bg-brand-magenta text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-magenta/90 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {t('products.requestQuote', lang)}
          </Link>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2
            className="text-xl font-bold text-brand-navy mb-6"          >
            {t('products.relatedProducts', lang)}
          </h2>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            }}
          >
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
