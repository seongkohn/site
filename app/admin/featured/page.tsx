'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<number | null>(null);
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

  async function handleReorder(productId: number, direction: 'up' | 'down') {
    setReordering(productId);
    try {
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', id: productId, direction }),
      });
      await fetchProducts();
    } catch {
      alert('Failed to reorder');
    }
    setReordering(null);
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
      alert('Failed to update');
    }
    setToggling(null);
    setSearch('');
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">Featured Products</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
          All Products
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        These products appear on the homepage. Drag to reorder, or add/remove products below.
      </p>

      {/* Current featured products */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xs font-medium text-gray-500 uppercase">
            Featured ({featured.length})
          </h2>
        </div>
        {featured.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No featured products yet. Search below to add some.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {featured.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleReorder(product.id, 'up')}
                      disabled={i === 0 || reordering !== null}
                      className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded hover:bg-gray-100"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(product.id, 'down')}
                      disabled={i === featured.length - 1 || reordering !== null}
                      className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded hover:bg-gray-100"
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(product.id, false)}
                    disabled={toggling !== null}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add products */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-2">Add to Featured</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or brand..."
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        {search && (
          <div className="divide-y divide-gray-100">
            {nonFeatured.length === 0 ? (
              <div className="px-4 py-4 text-center text-gray-400 text-sm">
                No matching non-featured products
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
                    + Add
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
