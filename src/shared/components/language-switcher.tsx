'use client';

import { useLocale, useTranslate } from '@/shared/i18n/locale-provider';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslate();
  return (
    <div className="language-switch" role="group" aria-label={t('Select language')}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
      <button type="button" onClick={() => void setLocale('en')} aria-pressed={locale === 'en'}>EN</button>
      <span className="language-divider">/</span>
      <button type="button" onClick={() => void setLocale('es')} aria-pressed={locale === 'es'}>ES</button>
    </div>
  );
}
