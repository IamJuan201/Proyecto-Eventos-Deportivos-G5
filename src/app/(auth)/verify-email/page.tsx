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
  return <div className="flex min-h-screen bg-sport-bg">
    <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sport-surface relative overflow-hidden px-12"><div className="absolute inset-0 bg-linear-to-br from-sport-emerald/10 to-transparent" /><div className="relative z-10 text-center space-y-6"><div className="w-20 h-20 rounded-full bg-sport-emerald/20 border-2 border-sport-emerald flex items-center justify-center mx-auto"><span className="text-4xl">✓</span></div><h1 className="text-4xl font-black text-sport-text">Verifica tu <span className="text-sport-emerald">correo</span></h1><p className="text-sport-muted text-lg max-w-xs">Un código de 8 dígitos protege tu cuenta.</p></div></div>
    <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12"><div className="w-full max-w-md space-y-8">
      <VerifyEmailForm
        email={email}
        reason={reason}
        nextPath={nextPath}
        initialExpiresInSeconds={state?.expiresInSeconds ?? 0}
        initialResendInSeconds={state?.resendInSeconds ?? 0}
        cooldownMinutes={getOtpResendCooldownMinutes()}
      />
    </div></div>
  </div>;
}
