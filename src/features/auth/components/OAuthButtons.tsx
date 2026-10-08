'use client';

import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { useTranslate } from '@/shared/i18n/locale-provider';

export function OAuthButtons({ nextPath = '/' }: { nextPath?: string }) {
  const t = useTranslate();
  const [error, setError] = useState('');
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('');
    try { await authService.loginWithOAuth(provider, nextPath); }
    catch (reason) { setError(reason instanceof Error ? t(reason.message) : t('No se pudo iniciar con OAuth.')); }
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <p className="text-center text-xs text-sport-muted">{t('Google y GitHub se habilitan al configurar Supabase. Puedes registrarte con tu correo para probar el sprint.')}</p>;
  return (
    <div className="space-y-3">
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => void handleOAuthLogin('google')}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sky-400 transition-colors shadow-sm"
      >
        <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.91 46.98 31.9 46.98 24.55Z" />
          <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.13 1.43-4.86 2.28-8.18 2.28-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
        </svg>
        <span>Google</span>
      </button>
      <button
        type="button"
        onClick={() => void handleOAuthLogin('github')}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sky-400 transition-colors shadow-sm"
      >
        <svg className="h-[18px] w-[18px] shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3 0 0 .95-.3 3.1 1.16a10.77 10.77 0 0 1 5.65 0c2.15-1.46 3.1-1.16 3.1-1.16.62 1.56.23 2.71.11 3 .73.8 1.17 1.8 1.17 3.04 0 4.35-2.64 5.3-5.16 5.59.41.36.77 1.04.77 2.1v3.12c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
        </svg>
        <span>GitHub</span>
      </button>
    </div></div>
  );
}
