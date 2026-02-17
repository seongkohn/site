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

/* ---- Pathology-themed SVG icons for the category grid ---- */
const iconClass = "w-7 h-7 flex-shrink-0 text-brand-purple";

function IconHistology() {
  // Tissue cassette / embedding block
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="24" height="20" rx="2" />
      <line x1="4" y1="11" x2="28" y2="11" />
      <rect x="9" y="15" width="14" height="8" rx="1" fill="currentColor" opacity="0.15" />
      <line x1="12" y1="15" x2="12" y2="23" />
      <line x1="20" y1="15" x2="20" y2="23" />
      <line x1="9" y1="19" x2="23" y2="19" />
    </svg>
  );
}

function IconCytology() {
  // ThinPrep slide with characteristic circle deposit
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="16" height="28" rx="1.5" />
      <rect x="8" y="2" width="16" height="6" rx="1.5" fill="currentColor" opacity="0.12" />
      <circle cx="16" cy="18" r="5" fill="currentColor" opacity="0.1" />
      <circle cx="16" cy="18" r="5" />
      <circle cx="14.5" cy="17" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="17" cy="19" r="0.6" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="16.5" r="0.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function IconDigitalPathology() {
  // Monitor displaying a scanned slide
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="26" height="18" rx="2" />
      <rect x="6" y="7" width="20" height="12" rx="1" fill="currentColor" opacity="0.08" />
      <line x1="13" y1="22" x2="19" y2="22" />
      <line x1="16" y1="22" x2="16" y2="26" />
      <line x1="11" y1="26" x2="21" y2="26" />
      {/* Slide thumbnail on screen */}
      <rect x="10" y="9" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="20" y="9" width="3" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function IconInstruments() {
  // Tissue processor / lab instrument
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="8" width="22" height="18" rx="2" />
      <rect x="5" y="8" width="22" height="5" rx="2" fill="currentColor" opacity="0.1" />
      <circle cx="9" cy="10.5" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="13" cy="10.5" r="1" fill="currentColor" opacity="0.4" />
      <rect x="9" y="17" width="14" height="6" rx="1" fill="currentColor" opacity="0.08" />
      <line x1="9" y1="20" x2="23" y2="20" />
      <line x1="5" y1="26" x2="8" y2="29" />
      <line x1="27" y1="26" x2="24" y2="29" />
    </svg>
  );
}

function IconConsumables() {
  // Microtome blade
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10 L28 10 L26 16 L4 16 Z" fill="currentColor" opacity="0.1" />
      <path d="M4 10 L28 10 L26 16 L4 16 Z" />
      <line x1="4" y1="16" x2="26" y2="16" strokeWidth="2.2" />
      <line x1="8" y1="12" x2="8" y2="14" strokeWidth="1.2" opacity="0.4" />
      <line x1="13" y1="11.5" x2="13" y2="14.5" strokeWidth="1.2" opacity="0.4" />
      <line x1="18" y1="11" x2="18" y2="15" strokeWidth="1.2" opacity="0.4" />
      <line x1="23" y1="10.5" x2="23" y2="15.5" strokeWidth="1.2" opacity="0.4" />
      {/* Blade edge highlight */}
      <path d="M3 16.5 L27 16.5" strokeWidth="0.8" opacity="0.3" />
      {/* Packaging hint */}
      <rect x="6" y="20" width="20" height="5" rx="1" opacity="0.5" />
      <line x1="11" y1="20" x2="11" y2="25" opacity="0.3" />
      <line x1="16" y1="20" x2="16" y2="25" opacity="0.3" />
      <line x1="21" y1="20" x2="21" y2="25" opacity="0.3" />
    </svg>
  );
}

function IconReagents() {
  // Reagent bottle with label
  return (
    <svg className={iconClass} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8 L12 4 L20 4 L20 8" />
      <path d="M11 8 L10 12 L10 27 Q10 29 12 29 L20 29 Q22 29 22 27 L22 12 L21 8 Z" />
      <rect x="12" y="16" width="8" height="6" rx="0.5" fill="currentColor" opacity="0.15" />
      <line x1="13" y1="18" x2="19" y2="18" strokeWidth="1.2" opacity="0.4" />
      <line x1="14" y1="20" x2="18" y2="20" strokeWidth="1.2" opacity="0.3" />
      {/* Liquid level */}
      <path d="M10.5 23 Q16 21 21.5 23 L22 27 Q22 29 20 29 L12 29 Q10 29 10 27 Z" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

const catIcons: Record<string, React.ReactNode> = {
  histology: <IconHistology />,
  cytology: <IconCytology />,
  'digital-pathology': <IconDigitalPathology />,
  instruments: <IconInstruments />,
  consumables: <IconConsumables />,
  reagents: <IconReagents />,
};

const homeCats = [
  { id: 'histology', filterParam: 'category', filterValue: 'histology', nameKey: 'homeCats.histology', descKey: 'homeCats.histologyDesc' },
  { id: 'cytology', filterParam: 'category', filterValue: 'cytology', nameKey: 'homeCats.cytology', descKey: 'homeCats.cytologyDesc' },
  { id: 'digital-pathology', filterParam: 'category', filterValue: 'digital-pathology', nameKey: 'homeCats.digitalPathology', descKey: 'homeCats.digitalPathologyDesc' },
  { id: 'instruments', filterParam: 'type', filterValue: 'instruments', nameKey: 'homeCats.instruments', descKey: 'homeCats.instrumentsDesc' },
  { id: 'consumables', filterParam: 'type', filterValue: 'consumables', nameKey: 'homeCats.consumables', descKey: 'homeCats.consumablesDesc' },
  { id: 'reagents', filterParam: 'type', filterValue: 'reagents', nameKey: 'homeCats.reagents', descKey: 'homeCats.reagentsDesc' },
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
              href={`/products?${cat.filterParam}=${cat.filterValue}`}
              className="group bg-white border border-gray-200 rounded-md p-5 flex gap-3 items-start hover:border-brand-magenta/30 hover:shadow-md"
            >
              {catIcons[cat.id]}
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
