'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SiteSettings {
  company_name_en: string;
  company_name_ko: string;
  company_address_en: string;
  company_address_ko: string;
  company_phone: string;
  company_fax: string;
  company_email: string;
}

const defaultSettings: SiteSettings = {
  company_name_en: 'SEONGKOHN TRADERS',
  company_name_ko: '성곤무역(주)',
  company_address_en: '38, Hakdong-ro 50-gil, Gangnam-gu, Seoul 06100',
  company_address_ko: '서울 강남구 학동로50길 38, 06100',
  company_phone: '+82-2-540-3311',
  company_fax: '',
  company_email: 'labsales@seongkohn.com',
};

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    fetch('/api/site-info')
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          company_name_en: data.company_name_en || defaultSettings.company_name_en,
          company_name_ko: data.company_name_ko || defaultSettings.company_name_ko,
          company_address_en: data.company_address_en || defaultSettings.company_address_en,
          company_address_ko: data.company_address_ko || defaultSettings.company_address_ko,
          company_phone: data.company_phone || defaultSettings.company_phone,
          company_fax: data.company_fax || defaultSettings.company_fax,
          company_email: data.company_email || defaultSettings.company_email,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
