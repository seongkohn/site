'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || data);
    } catch {
      // error
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete product');
    }
  }

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name_en.toLowerCase().includes(q) ||
      p.name_ko.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.manufacturer_name_en || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="text-sm text-gray-500">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">Products</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="bg-brand-purple text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-brand-magenta text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-navy">{product.name_en}</div>
                  <div className="text-xs text-gray-400">
                    {product.manufacturer_name_en}
                    {product.manufacturer_name_en && product.category_name_en ? ' / ' : ''}
                    {product.category_name_en}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {product.type_name_en && (
                    <span className="inline-block bg-brand-pale text-brand-navy text-xs px-2 py-0.5 rounded">
                      {product.type_name_en}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono text-gray-600">{product.sku}</code>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-brand-purple hover:text-brand-magenta text-xs mr-3"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
