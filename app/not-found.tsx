'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function NotFound() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1
        className="text-6xl font-bold text-brand-navy mb-4"
>
        404
      </h1>
      <h2
        className="text-2xl font-bold text-brand-navy mb-2"
>
        {t('common.notFound', lang)}
      </h2>
      <p className="text-gray-500 mb-8">
        {t('common.notFoundDesc', lang)}
      </p>
      <Link
        href="/"
        className="inline-block bg-brand-magenta text-white font-semibold py-2.5 px-6 rounded-md hover:bg-brand-magenta/90 transition"
      >
        {t('common.backHome', lang)}
      </Link>
    </div>
  );
}
