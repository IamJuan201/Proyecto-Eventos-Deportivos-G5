'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslate } from '@/shared/i18n/locale-provider';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (controlRef.current && !controlRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function chooseLanguage(nextLocale: 'en' | 'es') {
    setIsOpen(false);
    void setLocale(nextLocale);
  }

  return (
    <div className="language-control" ref={controlRef}>
      <button
        type="button"
        className="language-trigger"
        aria-label={t('Select language')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18" /></svg>
        <span>{locale.toUpperCase()}</span>
        <svg className={`language-chevron ${isOpen ? 'is-open' : ''}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {isOpen && (
        <div className="language-menu" role="menu" aria-label={t('Select language')}>
          <button type="button" role="menuitemradio" aria-checked={locale === 'es'} onClick={() => chooseLanguage('es')}>
            <span>ES</span><span>Español</span>{locale === 'es' && <span className="language-check" aria-hidden="true">✓</span>}
          </button>
          <button type="button" role="menuitemradio" aria-checked={locale === 'en'} onClick={() => chooseLanguage('en')}>
            <span>EN</span><span>English</span>{locale === 'en' && <span className="language-check" aria-hidden="true">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
