'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { authService, AuthError, safeNextPath } from '@/features/auth/services/auth.service';

/**
 * Length of the numeric verification code. Mirrors OTP_LENGTH in otp.service.
 */
const CODE_LENGTH = 8;

/**
 * Props for the OTP verification form.
 */
interface VerifyEmailFormProps {
  /**
   * Account email the code was sent to.
   */
  email: string;
  /**
   * Entry point: register shows the welcome copy, login the resume copy.
   */
  reason: 'register' | 'login';
  /**
   * Destination after a successful verification.
   */
  nextPath: string;
  /**
   * Seconds until the current code expires, at render time.
   */
  initialExpiresInSeconds: number;
  /**
   * Seconds until a new code can be requested, at render time.
   */
  initialResendInSeconds: number;
  /**
   * Cooldown in minutes applied after each successful resend.
   */
  cooldownMinutes: number;
}

/**
 * Formats seconds as M:SS for the countdown labels.
 *
 * @param totalSeconds Remaining seconds.
 * @returns Formatted countdown text.
 */
function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * One-time-code form for email confirmation.
 * Verifies the 8-digit code, signs the user in and honors the resend cooldown.
 *
 * @param props Form props with the account email and timers.
 * @returns OTP verification form.
 */
export function VerifyEmailForm({ email, reason, nextPath, initialExpiresInSeconds, initialResendInSeconds, cooldownMinutes }: VerifyEmailFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(initialExpiresInSeconds);
  const [resendIn, setResendIn] = useState(initialResendInSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Submits the code and redirects on success.
   *
   * @param event Form submit event.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    const clean = code.trim();
    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(clean)) { setError('Escribe el código de 8 dígitos.'); return; }
    setPending(true);
    try {
      const user = await authService.verifyOtp(email, clean);
      const roleHome = user.role === 'admin' ? '/admin/metrics' : user.role === 'empleado' ? '/employee' : '/';
      const destination = safeNextPath(nextPath) === '/' ? roleHome : safeNextPath(nextPath);
      router.replace(destination); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo verificar el código.');
      setPending(false);
    }
  }

  /**
   * Requests a new code and restarts the cooldown timer.
   */
  async function resend() {
    if (resendIn > 0 || resending) return;
    setError(''); setNotice(''); setResending(true);
    try {
      await authService.resendOtp(email, reason);
      setNotice('Te enviamos un código nuevo. Revisa tu correo.');
      setResendIn(cooldownMinutes * 60);
    } catch (reason) {
      if (reason instanceof AuthError && typeof reason.retryAfterSeconds === 'number') {
        setResendIn(reason.retryAfterSeconds);
      }
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar el código.');
    } finally {
      setResending(false);
    }
  }

  const isLoginReason = reason === 'login';

  return <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-sport-text">{isLoginReason ? 'Confirma tu correo para continuar' : 'Revisa tu correo'}</h2>
      <p className="mt-2 text-sm text-sport-muted">
        {isLoginReason
          ? <>Cerraste la verificación antes de terminar. Ingresa el código de 8 dígitos que te enviamos a <strong className="text-sport-text">{email}</strong>.</>
          : <>Te enviamos un código de 8 dígitos a <strong className="text-sport-text">{email}</strong>. Ingrésalo para activar tu cuenta.</>}
      </p>
    </div>
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm font-medium text-sport-text">Código de verificación
        <input
          className="mt-1 block w-full rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-sport-text"
          name="code" inputMode="numeric" autoComplete="one-time-code" required
          pattern="[0-9]{8}" maxLength={8} minLength={8} placeholder="••••••••"
          value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
        />
      </label>
      {expiresIn > 0
        ? <p className="text-center text-sm text-sport-muted">El código vence en {formatCountdown(expiresIn)}.</p>
        : <p className="text-center text-sm text-red-400">El código venció. Pide uno nuevo para continuar.</p>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="text-sm text-sport-emerald">{notice}</p>}
      <button className="flex w-full justify-center rounded-lg bg-sport-emerald px-4 py-3 font-semibold text-sport-bg" type="submit" disabled={pending}>{pending ? 'Verificando…' : 'Confirmar correo'}</button>
    </form>
    <div className="text-center text-sm">
      {resendIn > 0
        ? <p className="text-sport-muted">Pedir otro código en {formatCountdown(resendIn)}.</p>
        : <button className="font-medium text-sport-emerald" type="button" onClick={resend} disabled={resending}>{resending ? 'Enviando…' : 'No me llegó. Enviar otro código'}</button>}
    </div>
  </div>;
}
