'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';
import { SortableList, SortableItem, DragHandle } from '@/components/admin/SortableList';

export default function FeaturedProductsPage() {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=9999');
      const data = await res.json();
      setProducts(data.products || data);
    } catch {
      // error
    }
    setLoading(false);
  }

  const featured = useMemo(() => {
    return products
      .filter((p) => p.is_featured)
      .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
  }, [products]);

  const nonFeatured = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return products
      .filter((p) => !p.is_featured)
      .filter((p) =>
        p.name_en.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand_name_en || '').toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [products, search]);

  async function handleReorder(orderedIds: (number | string)[]) {
    const prev = products;
    // Optimistically update featured_order
    setProducts((prods) => {
      const updated = [...prods];
      for (let i = 0; i < orderedIds.length; i++) {
        const p = updated.find((prod) => prod.id === orderedIds[i]);
        if (p) p.featured_order = i;
      }
      return updated;
    });
    try {
      await fetch('/api/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', ids: orderedIds }),
      });
    } catch {
      setProducts(prev);
    }
  }

  async function toggleFeatured(productId: number, makeFeatured: boolean) {
    setToggling(productId);
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: makeFeatured ? 1 : 0 }),
      });
      await fetchProducts();
    } catch {
      alert(ta('featured.updateFailed', lang));
    }
    setToggling(null);
    setSearch('');
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('common.loading', lang)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">{ta('featured.title', lang)}</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
          {ta('featured.allProducts', lang)}
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {ta('featured.description', lang)}
      </p>

      {/* Current featured products */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xs font-medium text-gray-500 uppercase">
            {`${ta('featured.featuredCount', lang)} (${featured.length})`}
          </h2>
        </div>
        {featured.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            {ta('featured.noFeatured', lang)}
          </div>
        ) : (
          <SortableList items={featured} onReorder={handleReorder}>
            <div className="divide-y divide-gray-100">
              {featured.map((product, i) => (
                <SortableItem key={product.id} id={product.id}>
                  {({ listeners, attributes }) => (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DragHandle listeners={listeners} attributes={attributes} />
                        <span className="text-sm text-gray-400 w-6 text-right font-mono">{i + 1}</span>
                        {product.image && (
                          <img src={product.image} alt="" className="w-10 h-10 object-contain border border-gray-100 rounded" />
                        )}
                        <div>
                          <span className="text-sm font-medium text-brand-navy">{product.name_en}</span>
                          <div className="text-xs text-gray-400">
                            {product.brand_name_en && <span>{product.brand_name_en}</span>}
                            {product.brand_name_en && product.sku && <span> &middot; </span>}
                            <span className="font-mono">{product.sku}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(product.id, false)}
                        disabled={toggling !== null}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {ta('common.remove', lang)}
                      </button>
                    </div>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableList>
        )}
      </div>

      {/* Add products */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-2">{ta('featured.addToFeatured', lang)}</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ta('featured.searchProducts', lang)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        {search && (
          <div className="divide-y divide-gray-100">
            {nonFeatured.length === 0 ? (
              <div className="px-4 py-4 text-center text-gray-400 text-sm">
                {ta('featured.noMatching', lang)}
              </div>
            ) : (
              nonFeatured.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {product.image && (
                      <img src={product.image} alt="" className="w-8 h-8 object-contain border border-gray-100 rounded" />
                    )}
                    <div>
                      <span className="text-sm text-brand-navy">{product.name_en}</span>
                      <span className="text-xs text-gray-400 font-mono ml-2">{product.sku}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(product.id, true)}
                    disabled={toggling !== null}
                    className="text-xs text-brand-purple hover:text-brand-magenta px-2 py-1 rounded hover:bg-brand-pale disabled:opacity-50"
                  >
                    {ta('featured.addBtn', lang)}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
