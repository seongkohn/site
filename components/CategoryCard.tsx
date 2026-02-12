'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import type { Category } from '@/lib/types';

const categoryIcons: Record<string, string> = {
  'tissue-processing': 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  'microtomy': 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
  'staining': 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  'embedding': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'coverslipping': 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z',
};

export default function CategoryCard({ category }: { category: Category }) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? category.name_en : category.name_ko;
  const iconPath = categoryIcons[category.slug] || categoryIcons['tissue-processing'];

  return (
    <Link
      href={`/products?category=${category.id}`}
      className="group bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:border-brand-purple/30 transition"
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-pale flex items-center justify-center group-hover:bg-brand-purple/10 transition">
        <svg className="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
        </svg>
      </div>
      <h3 className="font-semibold text-brand-navy text-sm group-hover:text-brand-magenta transition">
        {name}
      </h3>
    </Link>
  );
}
