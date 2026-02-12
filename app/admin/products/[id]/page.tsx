'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Category, Type, Manufacturer, Product } from '@/lib/types';

interface FormData {
  name_en: string;
  name_ko: string;
  sku: string;
  category_id: string;
  type_id: string;
  manufacturer_id: string;
  description_en: string;
  description_ko: string;
  features_en: string;
  features_ko: string;
  image: string;
  is_published: boolean;
  is_featured: boolean;
  related_ids: number[];
}

const emptyForm: FormData = {
  name_en: '',
  name_ko: '',
  sku: '',
  category_id: '',
  type_id: '',
  manufacturer_id: '',
  description_en: '',
  description_ko: '',
  features_en: '',
  features_ko: '',
  image: '',
  is_published: true,
  is_featured: false,
  related_ids: [],
};

export default function ProductFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/types').then((r) => r.json()),
      fetch('/api/manufacturers').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
      isNew ? Promise.resolve(null) : fetch(`/api/products/${id}`).then((r) => r.json()),
    ])
      .then(([cats, typs, mfrs, prods, productData]) => {
        setCategories(cats);
        setTypes(typs);
        setManufacturers(mfrs);
        const productList = prods.products || prods;
        setAllProducts(Array.isArray(productList) ? productList : []);

        if (productData && productData.product) {
          const p = productData.product;
          setForm({
            name_en: p.name_en || '',
            name_ko: p.name_ko || '',
            sku: p.sku || '',
            category_id: p.category_id ? String(p.category_id) : '',
            type_id: p.type_id ? String(p.type_id) : '',
            manufacturer_id: p.manufacturer_id ? String(p.manufacturer_id) : '',
            description_en: p.description_en || '',
            description_ko: p.description_ko || '',
            features_en: p.features_en || '',
            features_ko: p.features_ko || '',
            image: p.image || '',
            is_published: !!p.is_published,
            is_featured: !!p.is_featured,
            related_ids: productData.related_ids || [],
          });
        }
      })
      .catch(() => setError('Failed to load data'))
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new window.FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Upload failed');
        return;
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name_en: form.name_en,
        name_ko: form.name_ko,
        sku: form.sku,
        slug: slugify(form.name_en),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        type_id: form.type_id ? parseInt(form.type_id) : null,
        manufacturer_id: form.manufacturer_id ? parseInt(form.manufacturer_id) : null,
        description_en: form.description_en || null,
        description_ko: form.description_ko || null,
        features_en: form.features_en || null,
        features_ko: form.features_ko || null,
        image: form.image || null,
        is_published: form.is_published ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
        related_ids: form.related_ids,
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
        setError(err.error || 'Failed to save product');
        return;
      }

      router.push('/admin/products');
    } catch {
      setError('Failed to save product');
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

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  const otherProducts = allProducts.filter((p) => String(p.id) !== id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">
          {isNew ? 'Add Product' : 'Edit Product'}
        </h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name (English)</label>
            <input
              type="text"
              required
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
            <p className="text-xs text-gray-400 mt-1">Slug: {slugify(form.name_en) || '...'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name (Korean)</label>
            <input
              type="text"
              required
              value={form.name_ko}
              onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        {/* Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Manufacturer</label>
            <select
              value={form.manufacturer_id}
              onChange={(e) => setForm({ ...form, manufacturer_id: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">-- None --</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">-- None --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? '\u00A0\u00A0\u00A0' : ''}{c.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              value={form.type_id}
              onChange={(e) => setForm({ ...form, type_id: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              <option value="">-- None --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name_en}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
          <input
            type="text"
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full max-w-xs border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (English)</label>
            <textarea
              rows={4}
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (Korean)</label>
            <textarea
              rows={4}
              value={form.description_ko}
              onChange={(e) => setForm({ ...form, description_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Features (English, one per line)</label>
            <textarea
              rows={4}
              value={form.features_en}
              onChange={(e) => setForm({ ...form, features_en: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Features (Korean, one per line)</label>
            <textarea
              rows={4}
              value={form.features_ko}
              onChange={(e) => setForm({ ...form, features_ko: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Product Image</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleImageUpload}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brand-pale file:text-brand-navy hover:file:bg-gray-200"
            />
            {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
          </div>
          {form.image && (
            <div className="mt-2 flex items-center gap-3">
              <img src={form.image} alt="Preview" className="w-16 h-16 object-contain border border-gray-200 rounded" />
              <span className="text-xs text-gray-400">{form.image}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, image: '' })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="rounded border-gray-300"
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="rounded border-gray-300"
            />
            Featured
          </label>
        </div>

        {/* Related Products */}
        {otherProducts.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Related Products</label>
            <div className="border border-gray-200 rounded p-3 max-h-48 overflow-y-auto space-y-1">
              {otherProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.related_ids.includes(p.id)}
                    onChange={() => toggleRelated(p.id)}
                    className="rounded border-gray-300"
                  />
                  <span>{p.name_en}</span>
                  <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
          <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
