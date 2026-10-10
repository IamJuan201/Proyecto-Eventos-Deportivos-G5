'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { useTranslate } from '@/shared/i18n/locale-provider';

interface UserMenuDropdownProps {
  accountName: string;
  role?: string;
  email?: string;
}

export function UserMenuDropdown({
  accountName,
  role,
  email,
}: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslate();

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setPending(true);
    try {
      await authService.logout();
      setIsOpen(false);
      router.replace('/');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  // Obtener inicial para el avatar
  const initial = accountName ? accountName.trim().charAt(0).toUpperCase() : 'U';
  const homePath = role === 'admin' ? '/admin/metrics' : role === 'empleado' ? '/employee' : '/my-reservations';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${accountName}, ${t('Menú de cuenta')}`}
        className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-sky-400/50 transition-all duration-200 cursor-pointer"
      >
        {/* Texto blanco con el nombre del usuario */}
        <span className="hidden sm:inline text-sm font-medium text-white tracking-wide group-hover:text-sky-300 transition-colors max-w-[140px] truncate">
          {accountName}
        </span>

        {/* Círculo avatar en azul / cian */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-sky-500/30 group-hover:scale-105 transition-transform">
          {initial}
        </div>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-white/10 mb-1">
            <p className="text-xs font-semibold text-white truncate">{accountName}</p>
            {email && <p className="text-[11px] text-slate-400 truncate">{email}</p>}
            {role && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {role}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{t('Mi perfil')}</span>
            </Link>

            <Link
              href={homePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>{t(role === 'admin' ? 'Panel de administración' : role === 'empleado' ? 'Mi actividad' : 'Mis reservas')}</span>
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={pending}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{pending ? t('Cerrando sesión…') : t('Cerrar sesión')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

