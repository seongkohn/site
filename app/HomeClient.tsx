'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage, localize } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';
import ProductCard from '@/components/ProductCard';
import type { Product, Brand, HeroSlide } from '@/lib/types';

interface HomeClientProps {
  featuredProducts: Product[];
  brands: Brand[];
  heroSlides: HeroSlide[];
}

const homeCats = [
  { id: 'histology', nameKey: 'homeCats.histology', descKey: 'homeCats.histologyDesc', icon: '\uD83E\uDDEB' },
  { id: 'cytology', nameKey: 'homeCats.cytology', descKey: 'homeCats.cytologyDesc', icon: '\uD83D\uDD2C' },
  { id: 'digital-pathology', nameKey: 'homeCats.digitalPathology', descKey: 'homeCats.digitalPathologyDesc', icon: '\uD83D\uDDA5\uFE0F' },
  { id: 'instruments', nameKey: 'homeCats.instruments', descKey: 'homeCats.instrumentsDesc', icon: '\u2699\uFE0F' },
  { id: 'consumables', nameKey: 'homeCats.consumables', descKey: 'homeCats.consumablesDesc', icon: '\uD83D\uDCE6' },
  { id: 'reagents', nameKey: 'homeCats.reagents', descKey: 'homeCats.reagentsDesc', icon: '\uD83E\uDDEA' },
];

function FeaturedCarousel({ products, lang }: { products: Product[]; lang: 'en' | 'ko' }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const pausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el || pausedRef.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const cardWidth = el.querySelector(':scope > div')?.clientWidth || 260;
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > div')?.clientWidth || 260;
    el.scrollBy({ left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
    // Pause auto-rotation briefly after manual interaction
    pausedRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => { pausedRef.current = false; }, 8000);
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {t('home.featured', lang)}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="p-1.5 rounded-full border border-gray-300 text-gray-500 hover:bg-white hover:text-brand-navy disabled:opacity-30 disabled:cursor-default transition"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="p-1.5 rounded-full border border-gray-300 text-gray-500 hover:bg-white hover:text-brand-navy disabled:opacity-30 disabled:cursor-default transition"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-brand-magenta flex items-center gap-1 hover:underline"
            >
              {t('home.viewAll', lang)}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto scroll-smooth no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[220px] sm:w-[240px] lg:w-[260px]" style={{ scrollSnapAlign: 'start' }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeClient({ featuredProducts, brands, heroSlides }: HomeClientProps) {
  const { lang } = useLanguage();
  const [slideIndex, setSlideIndex] = useState(0);
  const slideCount = heroSlides.length || 1;

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => setSlideIndex((i) => (i + 1) % slideCount), 8000);
    return () => clearInterval(timer);
  }, [slideCount, heroSlides.length]);

  const stats = [
    { n: '35+', label: t('home.stat_years', lang) },
    { n: '4+', label: t('home.stat_partners', lang) },
    { n: '100+', label: t('home.stat_products', lang) },
    { n: '500+', label: t('home.stat_labs', lang) },
  ];

  const currentSlide = heroSlides[slideIndex] || null;

  const fallbackGradient = 'linear-gradient(135deg, #1A1A2E 0%, #85253B 60%, #494975 100%)';

  function renderSlideContent() {
    if (!currentSlide) return null;
    const isDark = currentSlide.text_color === 'dark';
    const isRight = currentSlide.text_align === 'right';
    const title = localize(lang, currentSlide.title_en, currentSlide.title_ko);
    const subtitle = localize(lang, currentSlide.subtitle_en, currentSlide.subtitle_ko);

    const content = (
      <div className={isDark ? 'text-black' : 'text-white'}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className={`text-base ${isDark ? 'text-black/70' : 'text-white/80'}`}>{subtitle}</p>
        )}
      </div>
    );

    if (currentSlide.link_url) {
      return (
        <Link href={currentSlide.link_url} className={`relative h-full flex items-center px-8 md:px-12 ${isRight ? 'justify-end' : 'justify-start'}`}>
          {content}
        </Link>
      );
    }

    return (
      <div className={`relative h-full flex items-center px-8 md:px-12 ${isRight ? 'justify-end' : 'justify-start'}`}>
        {content}
      </div>
    );
  }

  return (
    <div>
      {/* Hero section */}
      {heroSlides.length > 0 && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Hero slider — left edge aligns with All Categories selector */}
        <div className="relative h-[380px] overflow-hidden lg:ml-[228px]">
            {currentSlide?.image ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${currentSlide.image}')` }}
              >
                {/* Gray overlay */}
                <div className="absolute inset-0 bg-gray-800/20" />
              </div>
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: fallbackGradient }}
              />
            )}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {renderSlideContent()}
            {/* Arrows */}
            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={() => setSlideIndex((i) => (i - 1 + slideCount) % slideCount)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => setSlideIndex((i) => (i + 1) % slideCount)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
            {/* Dots */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
        </div>
      </div>
      )}

      {/* Gap */}
      <div className="h-6" />

      {/* Our Products grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2
          className="text-center text-xl font-bold text-gray-800 mb-9"
        >
          {t('home.ourProducts', lang)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {homeCats.map((cat) => (
            <Link
              key={cat.id}
              href="/products"
              className="group bg-white border border-gray-200 rounded-md p-5 flex gap-3 items-start hover:border-brand-magenta/30 hover:shadow-md"
            >
              <span className="text-2xl flex-shrink-0">{cat.icon}</span>
              <div>
                <h3 className="font-semibold text-sm text-gray-800 group-hover:text-brand-magenta">
                  {t(cat.nameKey, lang)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  {t(cat.descKey, lang)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products carousel */}
      {featuredProducts.length > 0 && (
        <FeaturedCarousel products={featuredProducts} lang={lang} />
      )}

      {/* Company intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-9 items-center">
          <div>
            <div className="text-[11px] font-semibold text-brand-magenta tracking-[0.1em] mb-1.5">
              {t('home.since1988', lang)}
            </div>
            <h2
              className="text-xl font-bold text-gray-800 mb-2.5 leading-snug"
            >
              {t('home.companyTagline', lang)}
            </h2>
            <p className="text-[13.5px] text-gray-500 leading-relaxed mb-4">
              {t('home.companyIntro', lang)}
            </p>
            <Link
              href="/about"
              className="inline-block bg-brand-magenta text-white px-5 py-2.5 rounded text-[13px] font-medium hover:opacity-90 transition"
            >
              {t('home.learnMore', lang)} &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-md p-[18px] text-center border border-gray-200"
              >
                <div
                  className="text-xl font-bold text-brand-magenta"
                >
                  {s.n}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners strip */}
      <section className="bg-brand-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[10px] font-semibold tracking-[0.15em] text-gray-400 mb-3.5">
            {t('home.ourPartners', lang)}
          </div>
          <div className="partner-marquee-mask mx-auto w-full max-w-2xl">
            <div
              className="partner-marquee-track"
              style={{ animationDuration: `${Math.max(30, brands.length * 6)}s` }}
            >
              {[...brands, ...brands].map((b, i) => (
                <span key={`${b.id}-${i}`} className="partner-marquee-item text-gray-300 text-sm font-medium">
                {localize(lang, b.name_en, b.name_ko)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
