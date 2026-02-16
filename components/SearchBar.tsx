'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, localize } from './LanguageProvider';
import { t } from '@/lib/i18n';
import type { Category, Type, Product } from '@/lib/types';

export default function SearchBar() {
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/types').then((r) => r.json()),
    ]).then(([cats, tps]) => {
      setCategories(cats);
      setTypes(tps);
    });
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data.results.slice(0, 6)); // Show max 6 suggestions
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  if (isAdmin) return null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    const qs = params.toString();
    setShowSuggestions(false);
    router.push(qs ? `/products?${qs}` : '/products');
  }

  function handleSuggestionClick(product: Product) {
    setShowSuggestions(false);
    router.push(`/products/${product.slug}`);
  }

  // Group categories: parents first, then children indented
  const parentCategories = categories.filter((c) => c.parent_id === null);
  const childCategories = categories.filter((c) => c.parent_id !== null);

  function getCategoryOptions() {
    const options: { value: string; label: string }[] = [];
    for (const parent of parentCategories) {
      options.push({
        value: String(parent.id),
        label: localize(lang, parent.name_en, parent.name_ko),
      });
      const children = childCategories.filter((c) => c.parent_id === parent.id);
      for (const child of children) {
        options.push({
          value: String(child.id),
          label: `— ${localize(lang, child.name_en, child.name_ko)}`,
        });
        const grandchildren = childCategories.filter((c) => c.parent_id === child.id);
        for (const grandchild of grandchildren) {
          options.push({
            value: String(grandchild.id),
            label: `—— ${localize(lang, grandchild.name_en, grandchild.name_ko)}`,
          });
        }
      }
    }
    return options;
  }

  const deptLinks = (
    <>
      {parentCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/products?category=${cat.id}`}
          className="block px-3.5 py-2 text-[13px] text-gray-500 border-b border-gray-50 hover:bg-brand-pale hover:text-brand-magenta transition"
          onClick={() => setDropdownOpen(false)}
        >
          {localize(lang, cat.name_en, cat.name_ko)}
        </Link>
      ))}
      <div className="border-t border-gray-200" />
      {types.map((type) => (
        <Link
          key={type.id}
          href={`/products?type=${type.id}`}
          className="block px-3.5 py-2 text-[13px] text-gray-500 font-medium border-b border-gray-50 hover:bg-brand-pale hover:text-brand-magenta transition"
          onClick={() => setDropdownOpen(false)}
        >
          {localize(lang, type.name_en, type.name_ko)}
        </Link>
      ))}
    </>
  );

  return (
    <div className="bg-brand-purple">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end h-[52px]">
          {/* All Departments — white box flush to bottom, acts as sidebar header */}
          <div
            ref={dropdownRef}
            className="hidden lg:block relative w-[220px] flex-shrink-0 self-stretch"
            onMouseEnter={() => { if (!isHome) setDropdownOpen(true); }}
            onMouseLeave={() => { if (!isHome) setDropdownOpen(false); }}
          >
            <button
              className="absolute top-2 left-0 w-full h-[36px] flex items-center gap-2 px-3.5 text-[13px] font-semibold text-gray-700 bg-white"
              type="button"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              {t('common.allDepartments', lang)}
            </button>

            {/* Dropdown: always open on homepage, hover on other pages */}
            {(isHome || dropdownOpen) && (
              <div className="absolute left-0 w-[220px] bg-white border border-gray-200 shadow-lg z-50" style={{ top: 'calc(0.5rem + 36px)' }}>
                {deptLinks}
              </div>
            )}
          </div>

          {/* Category dropdown + Search — joined together, vertically centered */}
          <form onSubmit={handleSearch} className="flex flex-1 h-[36px] mb-2 ml-2 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-full px-2.5 text-[12px] bg-gray-100 border-r border-gray-300 text-gray-600 cursor-pointer outline-none"
              style={{ minWidth: '120px' }}
            >
              <option value="">
                {lang === 'en' ? 'All categories' : '전체 카테고리'}
              </option>
              {getCategoryOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                placeholder={t('products.searchAll', lang)}
                className="w-full h-full px-3 text-sm bg-white outline-none"
              />
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionClick(product)}
                      className="w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-brand-pale transition flex items-center gap-3"
                    >
                      {product.image && (
                        <img src={product.image} alt="" className="w-8 h-8 object-contain rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {lang === 'en' ? product.name_en : product.name_ko}
                        </div>
                        {product.brand_name_en && (
                          <div className="text-xs text-gray-500 truncate">
                            {lang === 'en' ? product.brand_name_en : product.brand_name_ko || product.brand_name_en}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{product.sku}</div>
                    </button>
                  ))}
                  {suggestions.length > 0 && (
                    <button
                      type="submit"
                      className="w-full text-center px-3 py-2 text-xs text-brand-magenta font-medium bg-gray-50 hover:bg-gray-100 transition"
                    >
                      {lang === 'en' ? 'View all results' : '모든 결과 보기'}
                    </button>
                  )}
                </div>
              )}
              {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg z-50 px-3 py-3">
                  <div className="text-sm text-gray-500">
                    {lang === 'en' ? 'No products found' : '상품을 찾을 수 없습니다'}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="h-full px-3 bg-white flex items-center justify-center text-gray-500 hover:text-brand-magenta transition border-l border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
