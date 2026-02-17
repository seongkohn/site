'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Category, Type, Brand, Product } from '@/lib/types';
import RichTextEditor from '@/components/RichTextEditor';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

interface VariantRow {
  name_en: string;
  name_ko: string;
  sku: string;
}

interface GalleryImageRow {
  url: string;
  type: 'image' | 'video';
  alt_en: string;
  alt_ko: string;
  variant_index: number | null;
}

interface SpecRow {
  key_en: string;
  key_ko: string;
  value_en: string;
  value_ko: string;
}

interface FormData {
  mode: 'simple' | 'variable';
  name_en: string;
  name_ko: string;
  slug: string;
  sku: string;
  category_id: string;
  type_id: string;
  brand_id: string;
  description_en: string;
  description_ko: string;
  features_en: string;
  features_ko: string;
  detail_en: string;
  detail_ko: string;
  image: string;
  is_published: boolean;
  is_featured: boolean;
  related_ids: number[];
  variants: VariantRow[];
  images: GalleryImageRow[];
  specs: SpecRow[];
}

const emptyForm: FormData = {
  mode: 'simple',
  name_en: '',
  name_ko: '',
  slug: '',
  sku: '',
  category_id: '',
  type_id: '',
  brand_id: '',
  description_en: '',
  description_ko: '',
  features_en: '',
  features_ko: '',
  detail_en: '',
  detail_ko: '',
  image: '',
  is_published: true,
  is_featured: false,
  related_ids: [],
  variants: [],
  images: [],
  specs: [],
};

export default function ProductFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { lang } = useLanguage();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [relatedSearch, setRelatedSearch] = useState('');
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/types').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
      fetch('/api/products?admin=1&limit=9999&sort=alpha').then((r) => r.json()),
      isNew ? Promise.resolve(null) : fetch(`/api/products/${id}`).then((r) => r.json()),
    ])
      .then(([cats, typs, brds, prods, productData]) => {
        setCategories(cats);
        setTypes(typs);
        setBrands(brds);
        const productList = prods.products || prods;
        setAllProducts(Array.isArray(productList) ? productList : []);

        if (productData && productData.product) {
          const p = productData.product;
          const loadedVariants = (productData.variants || []).map((v: VariantRow) => ({
            name_en: v.name_en,
            name_ko: v.name_ko,
            sku: v.sku,
          }));

          // Map variant_id to variant_index based on loaded variants order
          const variantIdList = (productData.variants || []).map((v: { id: number }) => v.id);

          const loadedImages = (productData.images || []).map((img: { url: string; type: string; alt_en: string; alt_ko: string; variant_id: number | null }) => ({
            url: img.url,
            type: img.type as 'image' | 'video',
            alt_en: img.alt_en || '',
            alt_ko: img.alt_ko || '',
            variant_index: img.variant_id ? variantIdList.indexOf(img.variant_id) : null,
          }));

          // Find which gallery image matches the current thumbnail
          const thumbIdx = loadedImages.findIndex((img: GalleryImageRow) => img.url === p.image);
          setThumbnailIndex(thumbIdx >= 0 ? thumbIdx : 0);

          setForm({
            mode: p.mode === 'variable' || loadedVariants.length > 0 ? 'variable' : 'simple',
            name_en: p.name_en || '',
            name_ko: p.name_ko || '',
            slug: p.slug || '',
            sku: p.sku || '',
            category_id: p.category_id ? String(p.category_id) : '',
            type_id: p.type_id ? String(p.type_id) : '',
            brand_id: p.brand_id ? String(p.brand_id) : '',
            description_en: p.description_en || '',
            description_ko: p.description_ko || '',
            features_en: p.features_en || '',
            features_ko: p.features_ko || '',
            detail_en: p.detail_en || '',
            detail_ko: p.detail_ko || '',
            image: p.image || '',
            is_published: !!p.is_published,
            is_featured: !!p.is_featured,
            related_ids: productData.related_ids || [],
            variants: loadedVariants,
            images: loadedImages,
            specs: (productData.specs || []).map((s: { key_en: string; key_ko: string; value_en: string; value_ko: string }) => ({
              key_en: s.key_en,
              key_ko: s.key_ko,
              value_en: s.value_en,
              value_ko: s.value_ko,
            })),
          });
        }
      })
      .catch(() => {
        setErrorKey('productForm.loadFailed');
        setErrorText('');
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    try {
      const uploadedImages: GalleryImageRow[] = [];

      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new window.FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          alert(`${file.name}: ${err.error || ta('common.uploadFailed', lang)}`);
          continue;
        }

        const data = await res.json();
        uploadedImages.push({
          url: data.url,
          type: 'image',
          alt_en: '',
          alt_ko: '',
          variant_index: null
        });
      }

      if (uploadedImages.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedImages],
        }));
      }
    } catch {
      alert(ta('common.uploadFailed', lang));
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  }

  function addVideoToGallery() {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url: '', type: 'video', alt_en: '', alt_ko: '', variant_index: null }],
    }));
  }

  function removeGalleryImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function updateGalleryImage(index: number, field: keyof GalleryImageRow, value: string | number | null) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, [field]: value } : img)),
    }));
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= form.images.length) return;
    setForm((prev) => {
      const imgs = [...prev.images];
      [imgs[index], imgs[newIndex]] = [imgs[newIndex], imgs[index]];
      return { ...prev, images: imgs };
    });
  }

  function addSpec() {
    setForm((prev) => ({
      ...prev,
      specs: [...prev.specs, { key_en: '', key_ko: '', value_en: '', value_ko: '' }],
    }));
  }

  function removeSpec(index: number) {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  }

  function updateSpec(index: number, field: keyof SpecRow, value: string) {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setErrorText('');
    setSaving(true);

    try {
      // Derive thumbnail from gallery selection
      // thumbnailIndex refers to form.images (all media), so look up directly
      const selectedThumb = form.images[thumbnailIndex];
      const firstImage = form.images.find((img) => img.url && img.type === 'image');
      const thumbnailUrl = (selectedThumb?.type === 'image' && selectedThumb?.url) ? selectedThumb.url : firstImage?.url || form.image || null;

      const filteredVariants = form.variants.filter((v) => v.name_en && v.sku);
      if (form.mode === 'simple' && !form.sku.trim()) {
        setErrorText(lang === 'en' ? 'SKU is required for simple products.' : '단일형 제품에는 SKU가 필요합니다.');
        return;
      }
      if (form.mode === 'variable' && filteredVariants.length === 0) {
        setErrorText(lang === 'en' ? 'Add at least one variant for variable products.' : '옵션형 제품에는 최소 1개 이상의 변형이 필요합니다.');
        return;
      }

      const payload = {
        mode: form.mode,
        name_en: form.name_en,
        name_ko: form.name_ko,
        sku: form.sku,
        slug: form.slug || slugify(form.name_en),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        type_id: form.type_id ? parseInt(form.type_id) : null,
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        description_en: form.description_en || null,
        description_ko: form.description_ko || null,
        features_en: form.features_en || null,
        features_ko: form.features_ko || null,
        detail_en: form.detail_en || null,
        detail_ko: form.detail_ko || null,
        image: thumbnailUrl,
        is_published: form.is_published ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
        related_ids: form.related_ids,
        variants: form.mode === 'variable' ? filteredVariants : [],
        images: form.images.filter((img) => img.url),
        specs: form.specs.filter((s) => s.key_en && s.value_en),
      };

      const url = isNew ? '/api/products' : `/api/products/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error) {
          setErrorText(err.error);
          setErrorKey(null);
        } else {
          setErrorKey('productForm.saveFailed');
          setErrorText('');
        }
        return;
      }

      // For new products, get the ID from the response; for existing, use the current id
      let savedId = id;
      if (isNew) {
        const data = await res.json();
        savedId = String(data.product?.id || '');
      }
      router.push(`/admin/products?saved=${savedId}`);
    } catch {
      setErrorKey('productForm.saveFailed');
      setErrorText('');
    } finally {
      setSaving(false);
    }
  }

  function toggleRelated(productId: number) {
    setForm((prev) => {
      const ids = prev.related_ids.includes(productId)
        ? prev.related_ids.filter((rid) => rid !== productId)
        : [...prev.related_ids, productId];
      return { ...prev, related_ids: ids };
    });
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name_en: '', name_ko: '', sku: '' }],
    }));
  }

  function removeVariant(index: number) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
      // Clear variant_index references that pointed to this variant
      images: prev.images.map((img) => ({
        ...img,
        variant_index: img.variant_index === index ? null : img.variant_index !== null && img.variant_index > index ? img.variant_index - 1 : img.variant_index,
      })),
    }));
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('common.loading', lang)}</div>;
  }

  const otherProducts = allProducts.filter((p) => String(p.id) !== id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">
          {isNew ? ta('productForm.addProduct', lang) : ta('productForm.editProduct', lang)}
        </h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
          {ta('common.cancel', lang)}
        </Link>
      </div>

      {(errorKey || errorText) && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded mb-4">
          {errorKey ? ta(errorKey, lang) : errorText}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* ===== TOP: 2-column layout ===== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ===== RIGHT SIDEBAR (appears first on mobile) ===== */}
        <div className="w-full lg:w-1/3 lg:order-2 flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          {/* Publish Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ta('productForm.published', lang)}</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded border-gray-300"
                />
                {ta('productForm.published', lang)}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded border-gray-300"
                />
                {ta('productForm.featured', lang)}
              </label>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-magenta text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? ta('common.saving', lang) : isNew ? ta('productForm.createProduct', lang) : ta('productForm.saveChanges', lang)}
              </button>
              <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
                {ta('common.cancel', lang)}
              </Link>
            </div>
          </div>

          {/* Images Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ta('productForm.imagesThumbnail', lang)}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addVideoToGallery}
                  className="text-xs text-brand-purple hover:text-brand-magenta font-medium"
                >
                  {ta('productForm.addVideoUrl', lang)}
                </button>
                <label className="text-xs text-brand-purple hover:text-brand-magenta font-medium cursor-pointer">
                  {ta('productForm.uploadImage', lang)}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/tiff,image/bmp"
                    onChange={handleGalleryUpload}
                    multiple
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {uploadingGallery && <p className="text-xs text-gray-400">{ta('common.uploading', lang)}</p>}
            {form.images.length === 0 ? (
              <p className="text-xs text-gray-400">{ta('productForm.noImages', lang)}</p>
            ) : (
              <>
                {/* Compact thumbnail grid */}
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group">
                      {img.type === 'image' && img.url ? (
                        <Image
                          src={img.url}
                          alt=""
                          width={220}
                          height={220}
                          className={`w-full aspect-square object-contain border-2 rounded cursor-pointer ${thumbnailIndex === i ? 'border-brand-magenta' : 'border-gray-100'}`}
                          onClick={() => setExpandedImageIndex(expandedImageIndex === i ? null : i)}
                        />
                      ) : (
                        <div
                          className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer border-2 border-gray-100"
                          onClick={() => setExpandedImageIndex(expandedImageIndex === i ? null : i)}
                        >
                          {img.type === 'video' ? ta('productForm.video', lang) : 'N/A'}
                        </div>
                      )}
                      {/* Overlay controls */}
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.type === 'image' && img.url && (
                          <button
                            type="button"
                            onClick={() => setThumbnailIndex(i)}
                            className={`p-0.5 rounded text-xs ${thumbnailIndex === i ? 'bg-brand-magenta text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                            title={ta('productForm.thumb', lang)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="p-0.5 rounded bg-white/80 text-red-400 hover:text-red-600 hover:bg-white"
                          title={ta('common.remove', lang)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {/* Reorder buttons */}
                      <div className="absolute bottom-0.5 left-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} className="p-0.5 rounded bg-white/80 text-gray-500 hover:bg-white disabled:opacity-30" title="Move left">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        <button type="button" onClick={() => moveGalleryImage(i, 1)} disabled={i === form.images.length - 1} className="p-0.5 rounded bg-white/80 text-gray-500 hover:bg-white disabled:opacity-30" title="Move right">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                      {/* Thumbnail badge */}
                      {thumbnailIndex === i && (
                        <span className="absolute top-0.5 left-0.5 bg-brand-magenta text-white text-[10px] px-1 rounded">
                          {ta('productForm.thumb', lang)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Expanded image detail (inline) */}
                {expandedImageIndex !== null && expandedImageIndex < form.images.length && (() => {
                  const img = form.images[expandedImageIndex];
                  const i = expandedImageIndex;
                  return (
                    <div className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {img.type === 'image' ? ta('productForm.image', lang) : ta('productForm.video', lang)} #{i + 1}
                        </span>
                        <button type="button" onClick={() => setExpandedImageIndex(null)} className="text-gray-400 hover:text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {img.type === 'video' && (
                        <input
                          type="text"
                          value={img.url}
                          onChange={(e) => updateGalleryImage(i, 'url', e.target.value)}
                          placeholder={ta('productForm.videoEmbedUrl', lang)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        />
                      )}
                      <input
                        type="text"
                        value={img.alt_en}
                        onChange={(e) => updateGalleryImage(i, 'alt_en', e.target.value)}
                        placeholder={ta('productForm.altTextEn', lang)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                      <input
                        type="text"
                        value={img.alt_ko}
                        onChange={(e) => updateGalleryImage(i, 'alt_ko', e.target.value)}
                        placeholder={ta('productForm.altTextKo', lang)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                      {form.mode === 'variable' ? (
                        <select
                          value={img.variant_index ?? ''}
                          onChange={(e) => updateGalleryImage(i, 'variant_index', e.target.value === '' ? null : parseInt(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        >
                          <option value="">{ta('productForm.noLinkedVariant', lang)}</option>
                          {form.variants.map((v, vi) => (
                            <option key={vi} value={vi}>{v.name_en || `Variant ${vi + 1}`} ({v.sku})</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">{lang === 'en' ? 'Applies to product' : '제품 공통 이미지'}</span>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Related Products Card */}
          {otherProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ta('productForm.relatedProducts', lang)}</h3>
              {form.related_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.related_ids.map((rid) => {
                    const rp = otherProducts.find((p) => p.id === rid);
                    if (!rp) return null;
                    return (
                      <span
                        key={rid}
                        className="inline-flex items-center gap-1 bg-brand-pale text-brand-navy text-xs px-2 py-0.5 rounded-full"
                      >
                        {rp.name_en}
                        <button
                          type="button"
                          onClick={() => toggleRelated(rid)}
                          className="text-gray-400 hover:text-red-500 ml-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  placeholder={ta('productForm.searchRelated', lang)}
                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
                {relatedSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {otherProducts
                      .filter((p) => {
                        if (form.related_ids.includes(p.id)) return false;
                        const q = relatedSearch.toLowerCase();
                        return p.name_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                      })
                      .slice(0, 20)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { toggleRelated(p.id); setRelatedSearch(''); }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-brand-pale flex items-center justify-between"
                        >
                          <span className="truncate">{p.name_en}</span>
                          <span className="text-xs text-gray-400 font-mono ml-2 shrink-0">{p.sku}</span>
                        </button>
                      ))}
                    {otherProducts.filter((p) => {
                      if (form.related_ids.includes(p.id)) return false;
                      const q = relatedSearch.toLowerCase();
                      return p.name_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">{ta('productForm.noMatchingProducts', lang)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== LEFT COLUMN (main content) ===== */}
        <div className="w-full lg:w-2/3 lg:order-1 space-y-6">
          {/* Basic Info Card — Names + Slug */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.nameEn', lang)}</label>
                <input
                  type="text"
                  required
                  value={form.name_en}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name_en: newName,
                      slug: !prev.slug || prev.slug === slugify(prev.name_en) ? slugify(newName) : prev.slug,
                    }));
                  }}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.nameKo', lang)}</label>
                <input
                  type="text"
                  value={form.name_ko}
                  onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.slug', lang)}</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })}
                placeholder={slugify(form.name_en) || 'auto-generated-from-name'}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
              <p className="text-xs text-gray-400 mt-1">URL path: /products/{form.slug || slugify(form.name_en) || '...'}</p>
            </div>
          </div>

          {/* Classification Card — Brand / Category / Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.brand', lang)}</label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                >
                  <option value="">{ta('common.none', lang)}</option>
                  {brands.map((m) => (
                    <option key={m.id} value={m.id}>{m.name_en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.category', lang)}</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                >
                  <option value="">{ta('common.none', lang)}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '\u00A0\u00A0\u00A0' : ''}{c.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.type', lang)}</label>
                <select
                  value={form.type_id}
                  onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                >
                  <option value="">{ta('common.none', lang)}</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name_en}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SKU & Variants Card — Mode toggle, SKU (simple), Variants table (variable) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            {/* Mode toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">{ta('productForm.mode', lang)}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, mode: 'simple' }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    form.mode === 'simple'
                      ? 'border-brand-purple bg-brand-purple text-white'
                      : 'border-gray-300 text-gray-700 hover:border-brand-purple'
                  }`}
                >
                  {ta('productForm.modeSimple', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, mode: 'variable' }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    form.mode === 'variable'
                      ? 'border-brand-purple bg-brand-purple text-white'
                      : 'border-gray-300 text-gray-700 hover:border-brand-purple'
                  }`}
                >
                  {ta('productForm.modeVariable', lang)}
                </button>
              </div>
            </div>

            {/* SKU (simple mode) */}
            {form.mode === 'simple' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.sku', lang)}</label>
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full max-w-xs border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            )}

            {/* Variants table (variable mode) */}
            {form.mode === 'variable' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-500">{ta('productForm.variants', lang)}</label>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs text-brand-purple hover:text-brand-magenta font-medium"
                  >
                    {ta('productForm.addVariant', lang)}
                  </button>
                </div>
                {form.variants.length === 0 ? (
                  <p className="text-xs text-gray-400">{ta('productForm.noVariants', lang)}</p>
                ) : (
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.nameEn', lang)}</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.nameKo', lang)}</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.sku', lang)}</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.variants.map((v, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.name_en}
                                onChange={(e) => updateVariant(i, 'name_en', e.target.value)}
                                placeholder="e.g. 20x Objective"
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.name_ko}
                                onChange={(e) => updateVariant(i, 'name_ko', e.target.value)}
                                placeholder="e.g. 20x ..."
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                                placeholder="e.g. P250-20"
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeVariant(i)}
                                className="text-red-400 hover:text-red-600"
                                title={ta('common.remove', lang)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

        {/* ===== FULL-WIDTH SECTION (below the 2-col layout) ===== */}
        <div className="space-y-6">
          {/* Descriptions Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-brand-navy">{lang === 'en' ? 'Summary Content' : '요약 콘텐츠'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.descriptionEn', lang)}</label>
                <textarea
                  rows={4}
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.descriptionKo', lang)}</label>
                <textarea
                  rows={4}
                  value={form.description_ko}
                  onChange={(e) => setForm({ ...form, description_ko: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-brand-navy">{lang === 'en' ? 'Key Features' : '핵심 특징'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.featuresEn', lang)}</label>
                <textarea
                  rows={4}
                  value={form.features_en}
                  onChange={(e) => setForm({ ...form, features_en: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.featuresKo', lang)}</label>
                <textarea
                  rows={4}
                  value={form.features_ko}
                  onChange={(e) => setForm({ ...form, features_ko: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>
          </div>

          {/* Detailed Description Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-brand-navy">{lang === 'en' ? 'Detailed Content' : '상세 콘텐츠'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.detailEn', lang)}</label>
                <RichTextEditor
                  value={form.detail_en}
                  onChange={(value) => setForm((prev) => ({ ...prev, detail_en: value }))}
                  placeholder="Long-form product description..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{ta('productForm.detailKo', lang)}</label>
                <RichTextEditor
                  value={form.detail_ko}
                  onChange={(value) => setForm((prev) => ({ ...prev, detail_ko: value }))}
                  placeholder="..."
                />
              </div>
            </div>
          </div>

          {/* Specifications Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-brand-navy">{lang === 'en' ? 'Specifications' : '사양'}</h2>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">{ta('productForm.specifications', lang)}</label>
              <button
                type="button"
                onClick={addSpec}
                className="text-xs text-brand-purple hover:text-brand-magenta font-medium"
              >
                {ta('productForm.addSpec', lang)}
              </button>
            </div>
            {form.specs.length === 0 ? (
              <p className="text-xs text-gray-400">{ta('productForm.noSpecs', lang)}</p>
            ) : (
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.keyEn', lang)}</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.keyKo', lang)}</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.valueEn', lang)}</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">{ta('productForm.valueKo', lang)}</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.specs.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={s.key_en}
                            onChange={(e) => updateSpec(i, 'key_en', e.target.value)}
                            placeholder="e.g. Weight"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={s.key_ko}
                            onChange={(e) => updateSpec(i, 'key_ko', e.target.value)}
                            placeholder="e.g. ..."
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={s.value_en}
                            onChange={(e) => updateSpec(i, 'value_en', e.target.value)}
                            placeholder="e.g. 5 kg"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={s.value_ko}
                            onChange={(e) => updateSpec(i, 'value_ko', e.target.value)}
                            placeholder="e.g. 5 kg"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeSpec(i)}
                            className="text-red-400 hover:text-red-600"
                            title={ta('common.remove', lang)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
