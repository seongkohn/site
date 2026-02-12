'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ko',
  setLang: () => {},
  toggleLang: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'ko') {
      setLangState(saved);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      setLangState(browserLang.startsWith('ko') ? 'ko' : 'en');
    }
  }, []);

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
