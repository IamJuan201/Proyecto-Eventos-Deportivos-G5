'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { translate, type Locale } from './messages';

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => Promise<void> } | null>(null);

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setCurrentLocale] = useState(initialLocale);
  const router = useRouter();
  const value = useMemo(() => ({
    locale,
    async setLocale(nextLocale: Locale) {
      if (nextLocale === locale) return;
      try {
        const response = await fetch('/api/locale', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: nextLocale }),
        });
        if (!response.ok) return;
        setCurrentLocale(nextLocale);
        document.documentElement.lang = nextLocale;
        router.refresh();
      } catch {
        // Keep the current language if the preference cannot be saved.
      }
    },
  }), [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale debe usarse dentro de LocaleProvider.');
  return context;
}

export function useTranslate() {
  const { locale } = useLocale();
  return (text: string) => translate(text, locale);
}
