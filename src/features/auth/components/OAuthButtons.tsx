'use client';

import React from 'react';
import { authService } from '../services/auth.service';

export function OAuthButtons() {
  const handleOAuthLogin = (provider: 'google' | 'github') => {
    // Aquí llamamos al servicio que redirigirá al backend
    authService.loginWithOAuth(provider);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => handleOAuthLogin('google')}
        className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
      >
        <span>Google</span>
      </button>
      <button
        type="button"
        onClick={() => handleOAuthLogin('github')}
        className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
      >
        <span>GitHub</span>
      </button>
    </div>
  );
}
