'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/shared/components/language-switcher';
import { useTranslate } from '@/shared/i18n/locale-provider';

export function GuestHeaderControls() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslate();
  const isRegister = pathname === '/register';

  function navigateWithReturnPath(event: React.MouseEvent<HTMLAnchorElement>, destination: string) {
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next) return;
    event.preventDefault();
    router.push(`${destination}?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="guest-header-controls">
      <nav className={`auth-switch ${isRegister ? 'is-register' : 'is-login'}`} aria-label="Acceso a la cuenta">
        <span className="auth-switch-indicator" aria-hidden="true" />
        <Link
          href="/login"
          className="auth-switch-link login-link"
          aria-current={!isRegister ? 'page' : undefined}
          onClick={(event) => navigateWithReturnPath(event, '/login')}
        >
          <span className="auth-switch-text-full">{t('Iniciar sesión')}</span>
          <span className="auth-switch-text-short">{t('Entrar')}</span>
        </Link>
        <Link
          href="/register"
          className="auth-switch-link register-link"
          aria-current={isRegister ? 'page' : undefined}
          onClick={(event) => navigateWithReturnPath(event, '/register')}
        >
          <span className="auth-switch-text-full">{t('Registrarse')}</span>
          <span className="auth-switch-text-short">{t('Registro')}</span>
        </Link>
      </nav>
      <LanguageSwitcher />
    </div>
  );
}
