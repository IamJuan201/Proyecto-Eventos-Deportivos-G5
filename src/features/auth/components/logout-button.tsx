'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authService } from '@/features/auth/services/auth.service';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try { await authService.logout(); router.replace('/'); router.refresh(); }
    finally { setPending(false); }
  }
  return <button className="club-button header-cta" type="button" onClick={() => void logout()} disabled={pending}>{pending ? 'Saliendo…' : 'Cerrar sesión'}</button>;
}
