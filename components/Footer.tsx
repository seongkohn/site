'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { useSiteSettings } from './SiteSettingsProvider';
import { t } from '@/lib/i18n';

interface Category {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  parent_id: number | null;
}

export default function Footer() {
  const { lang } = useLanguage();
  const settings = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: Category[]) => {
        setCategories(data.filter((c) => c.parent_id === null));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="footer-organic text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">
              {t('common.companyNameEn', lang)}
            </h3>
            <p className="text-sm text-white/70">
              {t('footer.tagline', lang)}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-white/60 mb-3">
              {t('footer.contact', lang)}
            </h4>
            <div className="text-sm text-white/70 space-y-2">
              <p>{lang === 'ko' ? settings.company_address_ko : settings.company_address_en}</p>
              <p><a href={`tel:${settings.company_phone.replace(/[^+\d]/g, '')}`} className="hover:text-white transition">{settings.company_phone}</a></p>
              <p><a href={`mailto:${settings.company_email}`} className="hover:text-white transition">{settings.company_email}</a></p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-white/60 mb-3">
              {t('footer.products', lang)}
            </h4>
            <nav className="text-sm text-white/70 space-y-2">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="block hover:text-white transition">
                  {lang === 'ko' ? (cat.name_ko || cat.name_en) : cat.name_en}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} {lang === 'ko' ? settings.company_name_ko : settings.company_name_en}</p>
          <Link href="/admin" className="mt-2 sm:mt-0 hover:text-white/70 transition">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
