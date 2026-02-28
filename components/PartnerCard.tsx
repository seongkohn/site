'use client';

import Image from 'next/image';
import { useLanguage, localize } from './LanguageProvider';
import type { Brand } from '@/lib/types';
import { sanitizePublicUrl } from '@/lib/url-safety';

export default function PartnerCard({ brand }: { brand: Brand }) {
  const { lang } = useLanguage();
  const name = localize(lang, brand.name_en, brand.name_ko);
  const description = localize(lang, brand.description_en, brand.description_ko);
  const website = sanitizePublicUrl(brand.website, { allowRelative: false });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition">
      {brand.logo ? (
        <Image src={brand.logo} alt={name} width={120} height={48} className="h-12 mx-auto mb-4 object-contain" />
      ) : (
        <div className="text-4xl mb-4 opacity-50">&#127970;</div>
      )}
      <h3 className="font-semibold text-gray-800">{name}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{description}</p>
      )}
      {website && (
        <a
          href={website}
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
