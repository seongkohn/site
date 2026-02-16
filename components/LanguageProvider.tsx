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

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('lang') as Lang | null;
  if (saved === 'en' || saved === 'ko') return saved;
  if (typeof navigator !== 'undefined') {
    return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
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
