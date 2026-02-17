'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Pick the localized string, falling back to English if Korean is empty */
export function localize(lang: Lang, en: string | null | undefined, ko: string | null | undefined): string {
  if (lang === 'en') return en || '';
  return ko || en || '';
}

export function LanguageProvider({
  children,
  initialLang = 'en',
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    document.cookie = `lang=${newLang}; path=/; max-age=31536000; samesite=lax`;
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'ko' : 'en');
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
