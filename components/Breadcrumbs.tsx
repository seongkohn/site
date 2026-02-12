'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { t } from '@/lib/i18n';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { lang } = useLanguage();

  const allItems = [{ label: t('common.home', lang), href: '/' }, ...items];

  return (
    <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-magenta transition">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
