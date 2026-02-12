'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';
import PartnerCard from '@/components/PartnerCard';
import type { Manufacturer } from '@/lib/types';

interface PartnersClientProps {
  manufacturers: Manufacturer[];
}

export default function PartnersClient({ manufacturers }: PartnersClientProps) {
  const { lang } = useLanguage();

  return (
    <>
      {/* Hero Banner */}
      <section
        className="py-20 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #85253B 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t('partners.title', lang)}
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            {t('partners.subtitle', lang)}
          </p>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturers.map((manufacturer) => (
              <PartnerCard key={manufacturer.id} manufacturer={manufacturer} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
