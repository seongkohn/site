'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';
import ProductCard from '@/components/ProductCard';
import type { Product, Category, Type, Manufacturer } from '@/lib/types';

interface CategoryWithChildren extends Category {
  children: Category[];
}

interface Props {
  categories: CategoryWithChildren[];
  types: Type[];
  manufacturers: Manufacturer[];
  initialProducts: Product[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

export default function ProductsClient({
  categories,
  types,
  manufacturers,
  initialProducts,
  initialTotal,
  initialPage,
  initialTotalPages,
}: Props) {
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const activeCategory = searchParams.get('category') || '';
  const activeType = searchParams.get('type') || '';
  const activeManufacturer = searchParams.get('manufacturer') || '';
  const activeSearch = searchParams.get('search') || '';
  const activePage = searchParams.get('page') || '1';

  const [searchInput, setSearchInput] = useState(activeSearch);

  // Expand parent category if a subcategory is active
  useEffect(() => {
    if (activeCategory) {
      const catId = parseInt(activeCategory, 10);
      for (const parent of categories) {
        if (parent.children.some(c => c.id === catId)) {
          setExpandedCategories(prev => new Set(prev).add(parent.id));
          break;
        }
      }
    }
  }, [activeCategory, categories]);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page to 1 when filters change (unless we're setting page explicitly)
      if (!('page' in overrides)) {
        params.delete('page');
      }
      return `/products?${params.toString()}`;
    },
    [searchParams]
  );

  const fetchProducts = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const apiParams = new URL(url, window.location.origin).searchParams;
      const apiUrl = `/api/products?${apiParams.toString()}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // When URL changes, re-fetch from the API
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (activeType) params.set('type', activeType);
    if (activeManufacturer) params.set('manufacturer', activeManufacturer);
    if (activeSearch) params.set('search', activeSearch);
    if (activePage && activePage !== '1') params.set('page', activePage);

    fetchProducts(`/products?${params.toString()}`);
  }, [activeCategory, activeType, activeManufacturer, activeSearch, activePage, fetchProducts]);

  function handleFilter(key: string, value: string) {
    const currentValue = searchParams.get(key) || '';
    const newValue = currentValue === value ? '' : value;
    router.push(buildUrl({ [key]: newValue }), { scroll: false });
    setMobileFiltersOpen(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search: searchInput }), { scroll: false });
  }

  function handleClearFilters() {
    setSearchInput('');
    router.push('/products', { scroll: false });
  }

  function toggleCategoryExpand(id: number) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const hasActiveFilters = activeCategory || activeType || activeManufacturer || activeSearch;

  // Sidebar content used both in desktop and mobile
  const sidebarContent = (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('products.searchAll', lang)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 focus:border-brand-magenta"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-magenta"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="text-xs text-brand-magenta hover:underline"
        >
          {t('products.clearFilters', lang)}
        </button>
      )}

      {/* Category filter */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
          {t('products.category', lang)}
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={() => handleFilter('category', '')}
            className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
              !activeCategory
                ? 'bg-brand-pale text-brand-magenta font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('products.all', lang)}
          </button>
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => {
                  if (cat.children.length > 0) {
                    toggleCategoryExpand(cat.id);
                  }
                  handleFilter('category', String(cat.id));
                }}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition flex items-center justify-between ${
                  activeCategory === String(cat.id)
                    ? 'bg-brand-pale text-brand-magenta font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{lang === 'en' ? cat.name_en : cat.name_ko}</span>
                {cat.children.length > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                      expandedCategories.has(cat.id) ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              {cat.children.length > 0 && expandedCategories.has(cat.id) && (
                <div className="ml-3 space-y-0.5">
                  {cat.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleFilter('category', String(child.id))}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                        activeCategory === String(child.id)
                          ? 'bg-brand-pale text-brand-magenta font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {lang === 'en' ? child.name_en : child.name_ko}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
          {t('products.type', lang)}
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={() => handleFilter('type', '')}
            className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
              !activeType
                ? 'bg-brand-pale text-brand-magenta font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('products.all', lang)}
          </button>
          {types.map((typ) => (
            <button
              key={typ.id}
              onClick={() => handleFilter('type', String(typ.id))}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                activeType === String(typ.id)
                  ? 'bg-brand-pale text-brand-magenta font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang === 'en' ? typ.name_en : typ.name_ko}
            </button>
          ))}
        </div>
      </div>

      {/* Manufacturer filter */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
          {t('products.manufacturer', lang)}
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={() => handleFilter('manufacturer', '')}
            className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
              !activeManufacturer
                ? 'bg-brand-pale text-brand-magenta font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('products.all', lang)}
          </button>
          {manufacturers.map((mfr) => (
            <button
              key={mfr.id}
              onClick={() => handleFilter('manufacturer', String(mfr.id))}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                activeManufacturer === String(mfr.id)
                  ? 'bg-brand-pale text-brand-magenta font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang === 'en' ? mfr.name_en : mfr.name_ko}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-navy mb-6">
        {t('products.title', lang)}
      </h1>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">{sidebarContent}</div>
        </aside>

        {/* Mobile filter button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="bg-brand-magenta text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('products.filters', lang)}
          </button>
        </div>

        {/* Mobile filter slide-out panel */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-brand-navy">
                  {t('products.filters', lang)}
                </h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Product grid area */}
        <div className="flex-1 min-w-0">
          {/* Product count */}
          <p className="text-sm text-gray-500 mb-4">
            {total} {t('products.nProducts', lang)}
          </p>

          {/* Loading overlay */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-magenta" />
            </div>
          )}

          {/* Products grid */}
          {!loading && products.length > 0 && (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">{t('products.noResults', lang)}</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-brand-magenta hover:underline"
                >
                  {t('products.clearFilters', lang)}
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => router.push(buildUrl({ page: String(page - 1) }), { scroll: false })}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(buildUrl({ page: String(p) }), { scroll: false })}
                  className={`px-3 py-1.5 rounded text-sm transition ${
                    p === page
                      ? 'bg-brand-magenta text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => router.push(buildUrl({ page: String(page + 1) }), { scroll: false })}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                &raquo;
              </button>
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
