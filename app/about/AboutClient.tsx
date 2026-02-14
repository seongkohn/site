'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function AboutClient() {
  const { lang } = useLanguage();

  return (
    <>
      {/* Hero Banner */}
      <section
        className="py-20 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #353360 45%, #85253B 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"          >
            {t('about.title', lang)}
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            {t('about.subtitle', lang)}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="mx-auto" style={{ maxWidth: '700px' }}>
          <p className="text-gray-700 leading-relaxed mb-6">
            {t('about.description1', lang)}
          </p>
          <p className="text-gray-700 leading-relaxed mb-12">
            {t('about.description2', lang)}
          </p>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mission Card */}
            <div className="bg-brand-pale rounded-lg p-6 border border-gray-200">
              <h2
                className="text-xl font-bold text-brand-navy mb-3"
              >
                {t('about.mission', lang)}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('about.missionText', lang)}
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-brand-pale rounded-lg p-6 border border-gray-200">
              <h2
                className="text-xl font-bold text-brand-navy mb-3"
              >
                {t('about.vision', lang)}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('about.visionText', lang)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
