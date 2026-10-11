'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { authService, AuthError, safeNextPath } from '@/features/auth/services/auth.service';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { useTranslate } from '@/shared/i18n/locale-provider';
import { PasswordInput } from '@/shared/components/password-input';
import { TurnstileWidget, getTurnstileSiteKey, isTurnstileWidgetEnabled } from '@/features/auth/components/turnstile-widget';

function OAuthDivider({ label }: { label: string }) {
  return <div className="flex items-center gap-3 text-sm"><span className="h-px flex-1 bg-sport-border" /><span className="whitespace-nowrap text-sport-muted">{label}</span><span className="h-px flex-1 bg-sport-border" /></div>;
}

export function LoginForm({ nextPath = '/', oauthError = false }: { nextPath?: string; oauthError?: boolean }) {
  const t = useTranslate();
  const router = useRouter();
  const [error, setError] = useState(oauthError ? 'No se pudo completar el acceso con el proveedor. Inténtalo de nuevo.' : '');
  const [pending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState('');
  const captchaEnabled = isTurnstileWidgetEnabled();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    if (captchaEnabled && !turnstileToken) { setError(t('Completa la verificación de seguridad.')); return; }
    try {
      const user = await authService.login({ email: String(form.get('email')), password: String(form.get('password')), turnstileToken: turnstileToken || undefined });
      const roleHome = user.role === 'admin' ? '/admin/metrics' : user.role === 'empleado' ? '/employee' : '/';
      const destination = safeNextPath(nextPath) === '/' ? roleHome : safeNextPath(nextPath);
      startTransition(() => { router.replace(destination); router.refresh(); });
    }
    catch (reason) {
      if (reason instanceof AuthError && reason.emailConfirmationRequired && reason.email) {
        const destination = `/verify-email?email=${encodeURIComponent(reason.email)}&reason=login&next=${encodeURIComponent(safeNextPath(nextPath))}`;
        startTransition(() => { router.replace(destination); });
        return;
      }
      setError(reason instanceof Error ? t(reason.message) : t('No se pudo iniciar sesión.'));
    }
  }
  return <div className="space-y-6"><form className="space-y-5" onSubmit={submit}>
    <label className="block text-sm font-medium text-sport-text">{t('Correo electrónico')}<input className="club-input mt-2" name="email" type="email" autoComplete="email" required placeholder={t('ejemplo@correo.com')} /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Contraseña')}<PasswordInput className="club-input" wrapperClassName="mt-2" name="password" autoComplete="current-password" required placeholder="••••••••" /></label>
    <div className="auth-forgot-row"><Link href="/forgot-password" className="auth-forgot-link">{t('¿Olvidaste tu contraseña?')} <span aria-hidden="true">→</span></Link></div>
    {captchaEnabled && <TurnstileWidget siteKey={getTurnstileSiteKey()} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <button className="club-button w-full" type="submit" disabled={pending}>{pending ? t('Ingresando…') : t('Iniciar sesión')}</button>
  </form><OAuthDivider label={t('O continuar con')} /><OAuthButtons nextPath={safeNextPath(nextPath)} /></div>;
}

export function RegisterForm({ nextPath = '/' }: { nextPath?: string }) {
  const t = useTranslate();
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState('');
  const captchaEnabled = isTurnstileWidgetEnabled();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirm-password'))) { setError(t('Las contraseñas no coinciden.')); return; }
    if (captchaEnabled && !turnstileToken) { setError(t('Completa la verificación de seguridad.')); return; }
    try {
      const user = await authService.register({ fullName: String(form.get('name')), email: String(form.get('email')), password, turnstileToken: turnstileToken || undefined }, nextPath);
      if (user.emailConfirmationRequired) {
        const destination = `/verify-email?email=${encodeURIComponent(user.email)}&reason=register&next=${encodeURIComponent(safeNextPath(nextPath))}`;
        startTransition(() => { router.replace(destination); });
        return;
      }
      startTransition(() => { router.replace(safeNextPath(nextPath)); router.refresh(); });
    } catch (reason) { setError(reason instanceof Error ? t(reason.message) : t('No se pudo crear la cuenta.')); }
  }
  return <div className="space-y-6"><form className="space-y-4" onSubmit={submit}>
    <label className="block text-sm font-medium text-sport-text">{t('Nombre completo')}<input className="club-input mt-2" name="name" autoComplete="name" required minLength={3} placeholder={t('Juan Pérez')} /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Correo electrónico')}<input className="club-input mt-2" name="email" type="email" autoComplete="email" required placeholder={t('ejemplo@correo.com')} /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Contraseña')}<PasswordInput className="club-input" wrapperClassName="mt-2" name="password" autoComplete="new-password" required minLength={8} placeholder={t('Mínimo 8 caracteres')} /></label>
    <label className="block text-sm font-medium text-sport-text">{t('Confirmar contraseña')}<PasswordInput className="club-input" wrapperClassName="mt-2" name="confirm-password" autoComplete="new-password" required minLength={8} /></label>
    <label className="flex items-start gap-3 text-sm text-sport-muted"><input className="mt-1 accent-sport-emerald" type="checkbox" required />{t('Acepto los términos del servicio y la política de privacidad.')}</label>
    {captchaEnabled && <TurnstileWidget siteKey={getTurnstileSiteKey()} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <button className="club-button w-full" type="submit" disabled={pending}>{pending ? t('Creando cuenta…') : t('Crear cuenta')}</button>
  </form><OAuthDivider label={t('O regístrate con')} /><OAuthButtons nextPath={safeNextPath(nextPath)} /></div>;
}
