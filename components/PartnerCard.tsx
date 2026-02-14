'use client';

import { useLanguage } from './LanguageProvider';
import type { Brand } from '@/lib/types';

export default function PartnerCard({ brand }: { brand: Brand }) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? brand.name_en : brand.name_ko;
  const description = lang === 'en' ? brand.description_en : brand.description_ko;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition">
      {brand.logo ? (
        <img src={brand.logo} alt={name} className="h-12 mx-auto mb-4 object-contain" />
      ) : (
        <div className="text-4xl mb-4 opacity-50">&#127970;</div>
      )}
      <h3 className="font-semibold text-gray-800">{name}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{description}</p>
      )}
      {brand.website && (
        <a
          href={brand.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-brand-magenta hover:underline"
        >
          {lang === 'en' ? 'Visit Website' : '웹사이트 방문'} &rarr;
        </a>
      )}
    </div>
  );
}
