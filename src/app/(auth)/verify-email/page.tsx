import { redirect } from 'next/navigation';
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';
import { getOtpResendCooldownMinutes, getVerificationState } from '@/features/auth/services/otp.service';
import { safeNextPath } from '@/features/auth/services/auth.service';

/**
 * Email verification page shown after register and on login with pending confirmation.
 *
 * @param props Route props with email, reason and next search params.
 * @returns OTP verification view.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<'/verify-email'>) {
  const query = await searchParams;
  const email = typeof query.email === 'string' ? query.email.trim() : '';
  if (!email) redirect('/login');
  const reason = query.reason === 'login' ? 'login' : 'register';
  const nextPath = safeNextPath(typeof query.next === 'string' ? query.next : '/');
  const state = await getVerificationState(email);
  return <main className="auth-page verify-page">
    <div className="verify-layout">
      <section className="verify-intro"><span className="verify-mark" aria-hidden="true">✓</span><span className="eyebrow">ÉLITE CLUB · CUENTA SEGURA</span><h1>Verifica tu <span>correo</span></h1><p>Un código de un solo uso protege tu cuenta y tus reservas.</p></section>
      <section className="verify-card glass-panel">
      <VerifyEmailForm
        email={email}
        reason={reason}
        nextPath={nextPath}
        initialExpiresInSeconds={state?.expiresInSeconds ?? 0}
        initialResendInSeconds={state?.resendInSeconds ?? 0}
        cooldownMinutes={getOtpResendCooldownMinutes()}
      />
      </section>
    </div>
  </main>;
}
