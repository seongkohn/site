'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { t } from '@/lib/i18n';

export default function Footer() {
  const { lang } = useLanguage();

  const categories = [
    { en: 'Histology', ko: '조직병리' },
    { en: 'Cytology', ko: '세포병리' },
    { en: 'Digital Pathology', ko: '디지털 병리' },
    { en: 'Immunohistochemistry', ko: '면역조직화학' },
    { en: 'Molecular Pathology', ko: '분자병리' },
  ];

  return (
    <footer className="text-white" style={{ background: 'linear-gradient(135deg, #353360 0%, #353360 70%, #85253B 100%)' }}>
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
              <p>{t('footer.location', lang)}</p>
              <p>{t('footer.phone', lang)}</p>
              <p>labsales@seongkohn.com</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-white/60 mb-3">
              {t('footer.products', lang)}
            </h4>
            <nav className="text-sm text-white/70 space-y-2">
              {categories.map((cat) => (
                <Link key={cat.en} href="/products" className="block hover:text-white transition">
                  {lang === 'en' ? cat.en : cat.ko}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Seongkohn Traders Corporation</p>
          <Link href="/admin" className="mt-2 sm:mt-0 hover:text-white/70 transition">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
