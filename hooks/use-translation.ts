'use client';

import { useState, useEffect } from 'react';
import { getTranslation, Language, TranslationKey } from '@/lib/i18n';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // Listen for language change events
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail as Language);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const t = (key: TranslationKey): string => {
    return getTranslation(key, language);
  };

  return { t, language };
}
