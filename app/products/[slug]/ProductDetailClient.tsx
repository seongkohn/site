'use client';

import Image from 'next/image';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { useLanguage, localize } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import { useState, useEffect } from 'react';
import type { Product, Variant, ProductImage, ProductSpec } from '@/lib/types';

interface Props {
  product: Product;
  relatedProducts: Product[];
  variants: Variant[];
  images: ProductImage[];
  specs: ProductSpec[];
}

function getVideoEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Already an embed URL
  if (url.includes('embed')) return url;
  return null;
}

export default function ProductDetailClient({ product, relatedProducts, variants, images, specs }: Props) {
  const { lang } = useLanguage();
  const initialVariant = product.mode === 'variable' ? (variants[0] || null) : null;
  const initialVariantImageIndex = initialVariant ? images.findIndex((img) => img.variant_id === initialVariant.id) : -1;
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(initialVariant);
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialVariantImageIndex >= 0 ? initialVariantImageIndex : 0);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications'>('description');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check').then((res) => {
      if (res.ok) setIsAdmin(true);
    }).catch(() => {});
  }, []);

  const name = localize(lang, product.name_en, product.name_ko);
  const description = localize(lang, product.description_en, product.description_ko);
  const isEmptyHtml = (s: string | null | undefined) => !s || s.replace(/<(.|\n)*?>/g, '').trim().length === 0;
  const detailKo = isEmptyHtml(product.detail_ko) ? null : product.detail_ko;
  const detailEn = isEmptyHtml(product.detail_en) ? null : product.detail_en;
  const detail = localize(lang, detailEn, detailKo);
  const featuresRaw = localize(lang, product.features_en, product.features_ko);
  const features = featuresRaw ? featuresRaw.split('\n').filter(Boolean) : [];
  const categoryName = localize(lang, product.category_name_en, product.category_name_ko);
  const typeName = localize(lang, product.type_name_en, product.type_name_ko);
  const brandName = localize(lang, product.brand_name_en, product.brand_name_ko);
  const isVariableProduct = product.mode === 'variable' && variants.length > 0;

  // Build gallery items: use gallery images if available, else fall back to single product.image
  const hasGallery = images.length > 0;
  const galleryItems = hasGallery
    ? images
    : product.image
      ? [{ id: 0, product_id: product.id, url: product.image, type: 'image' as const, alt_en: null, alt_ko: null, variant_id: null, sort_order: 0 }]
      : [];

  function handleSelectVariant(variant: Variant) {
    setSelectedVariant(variant);
    if (!hasGallery) return;
    const idx = images.findIndex((img) => img.variant_id === variant.id);
    if (idx >= 0) setSelectedImageIndex(idx);
  }

  const currentItem = galleryItems[selectedImageIndex] || galleryItems[0];

  const tabs = [
    { key: 'description' as const, label: lang === 'en' ? 'Description' : '상세 설명' },
    { key: 'specifications' as const, label: lang === 'en' ? 'Specifications' : '사양' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: t('products.title', lang), href: '/products' },
          { label: name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left: Image Gallery */}
        <div>
          {/* Main display */}
          <div className="bg-white rounded-xl flex items-center justify-center aspect-square relative overflow-hidden">
            {currentItem ? (
              currentItem.type === 'video' ? (
                <iframe
                  src={getVideoEmbedUrl(currentItem.url) || currentItem.url}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={localize(lang, currentItem.alt_en, currentItem.alt_ko) || name}
                />
              ) : (
                <Image
                  src={currentItem.url}
                  alt={localize(lang, currentItem.alt_en, currentItem.alt_ko) || name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )
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

          {/* Thumbnail strip */}
          {galleryItems.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {galleryItems.map((item, i) => (
                <button
                  key={item.id || i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition ${
                    i === selectedImageIndex
                      ? 'border-brand-purple'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={item.url}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  )}
                </button>
              ))}
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
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-navy mb-2">
            {name}
          </h1>

          {/* Brand + SKU */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
            {brandName && (
              <span className="font-medium text-brand-navy">{brandName}</span>
            )}
            <span className="text-gray-300">|</span>
            <span>{t('products.sku', lang)}: {selectedVariant ? selectedVariant.sku : product.sku}</span>
          </div>

          {/* Variants */}
          {isVariableProduct && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Variations' : '제품 옵션'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariant(v)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      selectedVariant?.id === v.id
                        ? 'border-brand-purple bg-brand-purple text-white'
                        : 'border-gray-300 text-gray-700 hover:border-brand-purple'
                    }`}
                  >
                    {localize(lang, v.name_en, v.name_ko)}
                    <span className="ml-1 text-xs opacity-70">({v.sku})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Description (summary) */}
          {description && (
            <div className="mb-6">
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

          {/* Request a Quote + Edit button */}
          <div className="flex items-center gap-3">
            <Link
              href={(() => {
                const params = new URLSearchParams();
                params.set('product', String(product.id));
                params.set('name', name);
                params.set('sku', selectedVariant?.sku || variants[0]?.sku || product.sku);
                if (selectedVariant) params.set('variant', localize(lang, selectedVariant.name_en, selectedVariant.name_ko));
                params.set('lang', lang);
                return `/contact?${params.toString()}`;
              })()}
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
            {isAdmin && (
              <Link
                href={`/admin/products/${product.id}`}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm font-medium hover:border-brand-purple hover:text-brand-purple transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {lang === 'en' ? 'Edit' : '편집'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed sections */}
      <div className="mt-12">
        {/* Tab headers */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="py-6">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div>
              {/* Rich text detail or fallback to short description */}
              {detail ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700 break-words overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail) }}
                />
              ) : description ? (
                <p className="text-gray-700 leading-relaxed">{description}</p>
              ) : (
                <p className="text-gray-400 text-sm">{lang === 'en' ? 'No description available.' : '설명이 없습니다.'}</p>
              )}

            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div>
              {specs.length > 0 ? (
                <table className="w-full max-w-2xl text-sm">
                  <tbody>
                    {specs.map((spec, i) => (
                      <tr key={spec.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium text-gray-700 w-1/3">
                          {localize(lang, spec.key_en, spec.key_ko)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {localize(lang, spec.value_en, spec.value_ko)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm">{lang === 'en' ? 'No specifications available.' : '사양 정보가 없습니다.'}</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-brand-navy mb-4">
            {lang === 'en' ? 'Related Products' : '관련 제품'}
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
        </div>
      )}
    </main>
  );
}
