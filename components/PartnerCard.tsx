'use client';

import { useLanguage } from './LanguageProvider';
import type { Manufacturer } from '@/lib/types';

export default function PartnerCard({ manufacturer }: { manufacturer: Manufacturer }) {
  const { lang } = useLanguage();
  const name = lang === 'en' ? manufacturer.name_en : manufacturer.name_ko;
  const description = lang === 'en' ? manufacturer.description_en : manufacturer.description_ko;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition">
      {manufacturer.logo ? (
        <img src={manufacturer.logo} alt={name} className="h-12 mx-auto mb-4 object-contain" />
      ) : (
        <div className="text-4xl mb-4 opacity-50">&#127970;</div>
      )}
      <h3 className="font-semibold text-gray-800">{name}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{description}</p>
      )}
      {manufacturer.website && (
        <a
          href={manufacturer.website}
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
