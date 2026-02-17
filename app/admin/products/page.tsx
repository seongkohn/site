'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function ProductsPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const savedRowRef = useRef<HTMLTableRowElement>(null);

  // Quick-edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name_en: '', name_ko: '', slug: '', sku: '' });
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?admin=1&limit=9999&sort=alpha');
      const data = await res.json();
      setProducts(data.products || data);
    } catch {
      // error
    }
    setLoading(false);
  }

  // Handle ?saved=ID param: highlight row, jump to correct page, show toast
  useEffect(() => {
    const sid = searchParams.get('saved');
    if (!sid || products.length === 0) return;
    const numId = parseInt(sid);
    if (isNaN(numId)) return;

    setSavedId(numId);
    setShowToast(true);

    // Find which page this product is on (in the unfiltered list)
    const idx = products.findIndex((p) => p.id === numId);
    if (idx >= 0) {
      setPage(Math.floor(idx / perPage) + 1);
    }

    // Clean up URL param
    router.replace('/admin/products', { scroll: false });

    // Auto-dismiss highlight and toast
    const timer = setTimeout(() => {
      setSavedId(null);
      setShowToast(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [products, searchParams, perPage, router]);

  // Scroll to the saved row once it renders
  useEffect(() => {
    if (savedId && savedRowRef.current) {
      savedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [savedId, page]);

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
    if (!confirm(ta('products.confirmDelete', lang))) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert(ta('products.deleteFailed', lang));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} ${ta('products.confirmBulkDelete', lang)}`)) return;
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
      alert(ta('products.bulkDeleteFailed', lang));
    }
    setDeleting(false);
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditForm({
      name_en: product.name_en,
      name_ko: product.name_ko,
      slug: product.slug,
      sku: product.sku,
    });
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function saveQuickEdit() {
    if (editingId === null) return;
    setQuickSaving(true);
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Save failed');
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...editForm } : p))
      );
      setEditingId(null);
      setToastMessage(lang === 'en' ? 'Product updated.' : '제품이 수정되었습니다.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      alert(lang === 'en' ? 'Failed to save changes.' : '저장에 실패했습니다.');
    }
    setQuickSaving(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); saveQuickEdit(); }
    if (e.key === 'Escape') { cancelEditing(); }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">{ta('products.loadingProducts', lang)}</div>;
  }

  const allOnPageSelected = paginated.length > 0 && paginated.every((p) => selected.has(p.id));

  return (
    <div>
      {/* Save confirmation toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {toastMessage || (lang === 'en' ? 'Product saved successfully.' : '제품이 저장되었습니다.')}
          <button onClick={() => setShowToast(false)} className="ml-2 text-white/70 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">{ta('products.title', lang)}</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="bg-brand-purple text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
          >
            {ta('products.importCsv', lang)}
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-brand-magenta text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
          >
            {ta('products.addProduct', lang)}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder={ta('products.searchProducts', lang)}
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
            {deleting ? ta('common.deleting', lang) : `${ta('common.delete', lang)} ${selected.size} ${ta('products.deleteSelected', lang)}`}
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
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('products.product', lang)}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('products.slug', lang)}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('products.type', lang)}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('products.sku', lang)}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{ta('common.actions', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => {
              const isEditing = editingId === product.id;
              return (
              <tr
                key={product.id}
                ref={product.id === savedId ? savedRowRef : undefined}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-1000 ${
                  isEditing
                    ? 'bg-yellow-50/50'
                    : product.id === savedId
                      ? 'bg-green-50 ring-1 ring-green-200'
                      : selected.has(product.id)
                        ? 'bg-brand-pale/40'
                        : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="rounded border-gray-300"
                    disabled={isEditing}
                  />
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={editForm.name_en}
                        onChange={(e) => setEditForm((f) => ({ ...f, name_en: e.target.value }))}
                        onKeyDown={handleEditKeyDown}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        placeholder="Name (EN)"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editForm.name_ko}
                        onChange={(e) => setEditForm((f) => ({ ...f, name_ko: e.target.value }))}
                        onKeyDown={handleEditKeyDown}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        placeholder="Name (KO)"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-brand-navy">{product.name_en}</div>
                      <div className="text-xs text-gray-400">
                        {product.brand_name_en}
                        {product.brand_name_en && product.category_name_en ? ' / ' : ''}
                        {product.category_name_en}
                      </div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      onKeyDown={handleEditKeyDown}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="slug"
                    />
                  ) : (
                    <code className="text-xs font-mono text-gray-500">{product.slug}</code>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.type_name_en && (
                    <span className="inline-block bg-brand-pale text-brand-navy text-xs px-2 py-0.5 rounded">
                      {product.type_name_en}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.sku}
                      onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
                      onKeyDown={handleEditKeyDown}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="SKU"
                    />
                  ) : (
                    <code className="text-xs font-mono text-gray-600">{product.sku}</code>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveQuickEdit}
                        disabled={quickSaving}
                        className="text-green-600 hover:text-green-800 text-xs mr-2 disabled:opacity-50"
                        title={lang === 'en' ? 'Save' : '저장'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={quickSaving}
                        className="text-gray-500 hover:text-gray-700 text-xs disabled:opacity-50"
                        title={lang === 'en' ? 'Cancel' : '취소'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(product)}
                        className="text-gray-400 hover:text-brand-purple text-xs mr-3"
                        title={lang === 'en' ? 'Quick edit' : '빠른 수정'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-gray-500 hover:text-brand-navy text-xs mr-3"
                        target="_blank"
                      >
                        {ta('products.view', lang)}
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-brand-purple hover:text-brand-magenta text-xs mr-3"
                      >
                        {ta('common.edit', lang)}
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        {ta('common.delete', lang)}
                      </button>
                    </>
                  )}
                </td>
              </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  {ta('products.noProducts', lang)}
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
            <span>{ta('products.show', lang)}</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>{ta('products.perPage', lang)}</span>
            <span className="text-gray-400 ml-2">
              ({filtered.length} {ta('products.total', lang)}{search ? `, ${ta('products.filtered', lang)}` : ''})
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
