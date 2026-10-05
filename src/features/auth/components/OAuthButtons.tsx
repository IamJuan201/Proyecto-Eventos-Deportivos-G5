'use client';

import React, { useState } from 'react';
import { authService } from '../services/auth.service';

export function OAuthButtons({ nextPath = '/' }: { nextPath?: string }) {
  const [error, setError] = useState('');
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('');
    try { await authService.loginWithOAuth(provider, nextPath); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar con OAuth.'); }
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <p className="text-center text-xs text-sport-muted">Google y GitHub se habilitan al configurar Supabase. Puedes registrarte con tu correo para probar el sprint.</p>;
  return (
    <div className="space-y-3">
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => void handleOAuthLogin('google')}
        className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
      >
        <span>Google</span>
      </button>
      <button
        type="button"
        onClick={() => void handleOAuthLogin('github')}
        className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
      >
        <span>GitHub</span>
      </button>
    </div></div>
  );
}
