'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

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

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      p.name_en.toLowerCase().includes(q) ||
      p.name_ko.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.brand_name_en || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page when search or perPage changes
  useEffect(() => { setPage(1); }, [search, perPage]);
  // Clear selection when page/search changes
  useEffect(() => { setSelected(new Set()); }, [page, search, perPage]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pageIds = paginated.map((p) => p.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete product');
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} product(s)?`)) return;
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/products/${id}`, { method: 'DELETE' })
        )
      );
      setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
    } catch {
      alert('Some deletions failed');
    }
    setDeleting(false);
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading products...</div>;
  }

  const allOnPageSelected = paginated.length > 0 && paginated.every((p) => selected.has(p.id));

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

      <div className="flex items-center justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50 whitespace-nowrap"
          >
            {deleting ? 'Deleting...' : `Delete ${selected.size} selected`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => (
              <tr
                key={product.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${selected.has(product.id) ? 'bg-brand-pale/40' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-navy">{product.name_en}</div>
                  <div className="text-xs text-gray-400">
                    {product.brand_name_en}
                    {product.brand_name_en && product.category_name_en ? ' / ' : ''}
                    {product.category_name_en}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono text-gray-500">{product.slug}</code>
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
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-gray-500 hover:text-brand-navy text-xs mr-3"
                    target="_blank"
                  >
                    View
                  </Link>
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
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>per page</span>
            <span className="text-gray-400 ml-2">
              ({filtered.length} total{search ? ', filtered' : ''})
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded text-sm ${
                    p === page
                      ? 'bg-brand-magenta text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
