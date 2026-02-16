'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { t, type Lang } from '@/lib/i18n';
import type { AboutTimelineEntry } from '@/lib/about-timeline';

type LocalizedText = {
  en: string;
  ko: string;
};

type ProductRangeCard = {
  category: LocalizedText;
  description: LocalizedText;
  href: string;
};

type WhyChooseIcon = 'expertise' | 'support' | 'supply' | 'partnership';

type WhyChooseCard = {
  title: string;
  description: LocalizedText;
  icon: WhyChooseIcon;
  emphasis: LocalizedText;
};

type AboutClientProps = {
  timelineEntries: AboutTimelineEntry[];
};

const whyChooseUs: WhyChooseCard[] = [
  {
    title: 'Pathology-First Expertise',
    description: {
      en: 'Focused domain knowledge across tissue processing, cytology, and digital pathology.',
      ko: '조직병리, 세포병리, 디지털병리 전반에 특화된 전문성.',
    },
    icon: 'expertise',
    emphasis: { en: '35+ years in pathology support', ko: '35년+ 병리 분야 전문 운영' },
  },
  {
    title: 'Local Technical Support',
    description: {
      en: 'Korean-language support, installation guidance, and practical troubleshooting.',
      ko: '국내 환경에 맞춘 기술지원, 설치 가이드, 실무형 문제해결.',
    },
    icon: 'support',
    emphasis: { en: 'Korean on-site service response', ko: '국내 현장 중심 서비스 대응' },
  },
  {
    title: 'Reliable Supply & Pricing',
    description: {
      en: 'Consistent supply planning and clear commercial terms for routine procurement.',
      ko: '안정적인 공급 계획과 명확한 조건으로 반복 구매에 최적화.',
    },
    icon: 'supply',
    emphasis: { en: 'Stable procurement planning', ko: '안정적 반복 구매 운영' },
  },
  {
    title: 'Partnership Approach',
    description: {
      en: 'Collaborative planning with labs for upgrades, training, and long-term adoption.',
      ko: '검사실과 함께 업그레이드, 교육, 장기 운영 계획을 수립.',
    },
    icon: 'partnership',
    emphasis: { en: 'Long-term lab success focus', ko: '장기 성과 중심 파트너십' },
  },
];

const productRanges: ProductRangeCard[] = [
  {
    category: { en: 'Reagents', ko: '시약' },
    description: {
      en: 'Stains, fixatives, mounting media, and specialty pathology chemistry.',
      ko: '염색시약, 고정액, 봉입제 등 병리 핵심 시약군.',
    },
    href: '/products',
  },
  {
    category: { en: 'Instruments', ko: '장비' },
    description: {
      en: 'Tissue processors, microtomes, stainers, scanners, and automation systems.',
      ko: '조직처리기, 마이크로톰, 염색기, 스캐너 등 주요 장비.',
    },
    href: '/products',
  },
  {
    category: { en: 'Consumables', ko: '소모품' },
    description: {
      en: 'Slides, cassettes, blades, coverglass, and daily operational supplies.',
      ko: '슬라이드, 카세트, 블레이드, 커버글라스 등 일상 운영 소모품.',
    },
    href: '/products',
  },
  {
    category: { en: 'Digital & Imaging', ko: '디지털·이미징' },
    description: {
      en: 'Digital pathology workflows, image analysis, and integrated data tools.',
      ko: '디지털 병리 워크플로우, 이미지 분석, 데이터 연계 도구.',
    },
    href: '/products',
  },
];

function getText(content: LocalizedText, lang: Lang): string {
  return content[lang];
}

function getTimelineText(entry: AboutTimelineEntry, lang: Lang, field: 'title' | 'description' | 'imageAlt'): string {
  if (field === 'title') return lang === 'ko' ? entry.title_ko : entry.title_en;
  if (field === 'description') return lang === 'ko' ? entry.description_ko : entry.description_en;
  if (lang === 'ko') return entry.image_alt_ko || entry.image_alt_en || 'Timeline image';
  return entry.image_alt_en || entry.image_alt_ko || 'Timeline image';
}

function renderWhyIcon(icon: WhyChooseIcon) {
  const baseClass = 'h-8 w-8 text-brand-magenta';

  if (icon === 'expertise') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass}>
        <path d="M6 8a6 6 0 1 1 12 0v4a6 6 0 1 1-12 0V8Z" />
        <path d="M12 6v8" />
        <path d="M9 10h6" />
      </svg>
    );
  }

  if (icon === 'support') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass}>
        <path d="M4 12a8 8 0 1 1 16 0" />
        <path d="M6 12v3a2 2 0 0 0 2 2h2" />
        <path d="M18 12v3a2 2 0 0 1-2 2h-2" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  if (icon === 'supply') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass}>
        <path d="M3 7h18" />
        <path d="M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass}>
      <path d="M8 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
      <path d="m10.5 9.5 3 3" />
      <path d="m13.5 9.5-3 3" />
    </svg>
  );
}

export default function AboutClient({ timelineEntries }: AboutClientProps) {
  const { lang } = useLanguage();

  return (
    <>
      <section
        className="py-20 text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #353360 45%, #85253B 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title', lang)}</h1>
          <p className="text-lg md:text-xl text-white/80">{t('about.subtitle', lang)}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="mx-auto" style={{ maxWidth: '700px' }}>
          <p className="text-gray-700 leading-relaxed mb-6">{t('about.description1', lang)}</p>
          <p className="text-gray-700 leading-relaxed mb-12">{t('about.description2', lang)}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-pale rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-brand-navy mb-3">{t('about.mission', lang)}</h2>
              <p className="text-gray-600 leading-relaxed">{t('about.missionText', lang)}</p>
            </div>
            <div className="bg-brand-pale rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-brand-navy mb-3">{t('about.vision', lang)}</h2>
              <p className="text-gray-600 leading-relaxed">{t('about.visionText', lang)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-brand-navy">
              {lang === 'ko' ? '연혁 및 성장 타임라인' : 'Timeline & Company History'}
            </h2>
            <p className="text-gray-600 mt-2">
              {lang === 'ko'
                ? '성곤무역의 성장과 주요 전환점을 연도별로 확인하실 수 있습니다.'
                : 'Explore the milestones that shaped Seongkohn’s growth in pathology.'}
            </p>
          </div>

          <div className="relative md:pl-8">
            <div className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-5">
              {timelineEntries.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
                  {lang === 'ko' ? '표시할 타임라인 항목이 없습니다.' : 'No timeline entries to display.'}
                </div>
              )}

              {timelineEntries.map((item) => (
                <article key={item.id} className="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="hidden md:block absolute -left-[30px] top-8 h-3 w-3 rounded-full bg-brand-magenta ring-4 ring-brand-pale" />
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    <div className="sm:w-36 shrink-0">
                      <p className="text-xs font-semibold tracking-wider text-brand-magenta uppercase">{item.year}</p>
                      <div className="mt-2 w-full h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 relative">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={getTimelineText(item, lang, 'imageAlt')}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        ) : (
                          <Image
                            src="/images/timeline-placeholder.svg"
                            alt={lang === 'ko' ? '기본 이미지' : 'Placeholder image'}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy">{getTimelineText(item, lang, 'title')}</h3>
                      <p className="text-gray-600 mt-2 leading-relaxed">{getTimelineText(item, lang, 'description')}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-navy">
            {lang === 'ko' ? '왜 성곤무역인가?' : 'Why Choose Seongkohn'}
          </h2>
          <p className="text-gray-600 mt-2">
            {lang === 'ko'
              ? '전문성, 공급 안정성, 기술지원을 바탕으로 검사실 운영 성과를 지원합니다.'
              : 'We combine technical expertise, reliable supply, and local support for labs.'}
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {whyChooseUs.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-brand-pale flex items-center justify-center shrink-0">
                    {renderWhyIcon(item.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-magenta">
                      {getText(item.emphasis, lang)}
                    </p>
                    <p className="text-lg font-semibold text-brand-navy mt-1">{item.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">{getText(item.description, lang)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-navy">
            {lang === 'ko' ? '취급 제품군 개요' : 'Product Range Overview'}
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productRanges.map((item) => (
              <article key={item.category.en} className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="font-semibold text-brand-navy">{getText(item.category, lang)}</p>
                <p className="text-sm text-gray-600 mt-2">{getText(item.description, lang)}</p>
                <Link
                  href={item.href}
                  className="inline-block mt-4 text-sm font-medium text-brand-magenta hover:underline"
                >
                  {lang === 'ko' ? '제품 보기' : 'Explore products'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto rounded-xl bg-brand-navy text-white p-8 md:p-10">
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            {lang === 'ko' ? 'B2B 문의' : 'B2B Inquiries'}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {lang === 'ko'
              ? '대량 주문 또는 파트너십 상담이 필요하신가요?'
              : 'Need to discuss bulk orders or a lab partnership?'}
          </h2>
          <p className="mt-3 text-white/80 leading-relaxed">
            {lang === 'ko'
              ? '검사실 규모, 운영 환경, 예산 조건에 맞춰 적합한 제품 조합과 도입 일정을 함께 제안드립니다.'
              : 'Share your lab size, workflow, and budget goals. We can propose a practical product mix and rollout plan.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-block bg-white text-brand-navy font-semibold px-5 py-2.5 rounded-md hover:bg-white/90 transition"
            >
              {lang === 'ko' ? '문의하기' : 'Contact Sales'}
            </Link>
            <a
              href={`mailto:${t('contact.emailValue', lang)}`}
              className="inline-block border border-white/40 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-white/10 transition"
            >
              {lang === 'ko' ? '이메일 보내기' : 'Email Us'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
