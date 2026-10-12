'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { useTranslate } from '@/shared/i18n/locale-provider';

export function LogoutButton({ className = 'club-button club-button-secondary profile-logout' }: { className?: string }) {
  const router = useRouter();
  const t = useTranslate();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try { await authService.logout(); router.replace('/'); router.refresh(); }
    finally { setPending(false); }
  }
  return <button className={className} type="button" onClick={() => void logout()} disabled={pending}>{pending ? t('Cerrando sesión…') : t('Cerrar sesión')}</button>;
}
