'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { authService, safeNextPath } from '@/features/auth/services/auth.service';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { useTranslate } from '@/shared/i18n/locale-provider';

function OAuthDivider({ label }: { label: string }) {
  return <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sport-border" /></div><div className="relative flex justify-center text-sm"><span className="bg-sport-bg px-3 text-sport-muted">{label}</span></div></div>;
}

export function LoginForm({ nextPath = '/', oauthError = false }: { nextPath?: string; oauthError?: boolean }) {
  const t = useTranslate();
  const router = useRouter();
  const [error, setError] = useState(oauthError ? 'No se pudo completar el acceso con el proveedor. Inténtalo de nuevo.' : '');
  const [pending, startTransition] = useTransition();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const user = await authService.login({ email: String(form.get('email')), password: String(form.get('password')) });
      const roleHome = user.role === 'admin' ? '/admin/metrics' : user.role === 'empleado' ? '/employee' : '/';
      const destination = safeNextPath(nextPath) === '/' ? roleHome : safeNextPath(nextPath);
      startTransition(() => { router.replace(destination); router.refresh(); });
    }
    catch (reason) { setError(reason instanceof Error ? t(reason.message) : t('No se pudo iniciar sesión.')); }
  }
  return <div className="space-y-6"><form className="space-y-5" onSubmit={submit}>
    <label className="block text-sm font-medium text-sport-text">{t('Correo electrónico')}<input className="club-input mt-2" name="email" type="email" autoComplete="email" required placeholder="ejemplo@correo.com" /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Contraseña')}<input className="club-input mt-2" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>
    <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-sky-300 hover:text-sky-200">{t('¿Olvidaste tu contraseña?')}</Link></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <button className="club-button w-full" type="submit" disabled={pending}>{pending ? t('Ingresando…') : t('Iniciar sesión')}</button>
  </form><OAuthDivider label={t('O continuar con')} /><OAuthButtons nextPath={safeNextPath(nextPath)} /></div>;
}

export function RegisterForm({ nextPath = '/' }: { nextPath?: string }) {
  const t = useTranslate();
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirm-password'))) { setError(t('Las contraseñas no coinciden.')); return; }
    try {
      const user = await authService.register({ fullName: String(form.get('name')), email: String(form.get('email')), password }, nextPath);
      if (user.emailConfirmationRequired) { setMessage(t('Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.')); return; }
      startTransition(() => { router.replace(safeNextPath(nextPath)); router.refresh(); });
    } catch (reason) { setError(reason instanceof Error ? t(reason.message) : t('No se pudo crear la cuenta.')); }
  }
  return <div className="space-y-6"><form className="space-y-4" onSubmit={submit}>
    <label className="block text-sm font-medium text-sport-text">{t('Nombre completo')}<input className="club-input mt-2" name="name" autoComplete="name" required minLength={3} placeholder="Juan Pérez" /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Correo electrónico')}<input className="club-input mt-2" name="email" type="email" autoComplete="email" required placeholder="ejemplo@correo.com" /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Contraseña')}<input className="club-input mt-2" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder={t('Mínimo 8 caracteres')} /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Confirmar contraseña')}<input className="club-input mt-2" name="confirm-password" type="password" autoComplete="new-password" required minLength={8} /></label>
    <label className="flex items-start gap-3 text-sm text-sport-muted"><input className="mt-1 accent-sport-emerald" type="checkbox" required />{t('Acepto los términos del servicio y la política de privacidad.')}</label>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}{message && <p role="status" className="text-sm text-sport-emerald">{message} <Link className="underline" href="/login">{t('Ir a iniciar sesión')}</Link></p>}
    <button className="club-button w-full" type="submit" disabled={pending}>{pending ? t('Creando cuenta…') : t('Crear cuenta')}</button>
  </form><OAuthDivider label={t('O regístrate con')} /><OAuthButtons nextPath={safeNextPath(nextPath)} /></div>;
}
