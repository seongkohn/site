'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { t } from '@/lib/i18n';
import MobileMenu from './MobileMenu';

export default function Header() {
  const { lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/', label: t('nav.home', lang) },
    { href: '/products', label: t('nav.products', lang) },
    { href: '/about', label: t('nav.about', lang) },
    { href: '/partners', label: t('nav.partners', lang) },
    { href: '/contact', label: t('nav.contact', lang) },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/images/sk-logo.svg"
                alt="Seongkohn Logo"
                width={176}
                height={44}
                className="h-11 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13.5px] font-semibold text-gray-600 hover:text-brand-magenta px-3.5 py-2 transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Language toggle + mobile menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    lang === 'en' ? 'bg-brand-magenta text-white' : 'text-gray-500'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('ko')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    lang === 'ko' ? 'bg-brand-magenta text-white' : 'text-gray-500'
                  }`}
                >
                  한국어
                </button>
              </div>
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 text-gray-700"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
      />
    </header>
  );
}
