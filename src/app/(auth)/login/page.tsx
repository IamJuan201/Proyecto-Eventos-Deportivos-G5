import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/auth-forms';
import { getLocale } from '@/shared/i18n/locale.server';
import { translate } from '@/shared/i18n/messages';

const safeNextPath = (value: string | undefined) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/';

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const query = await searchParams;
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const nextPath = safeNextPath(typeof query.next === 'string' ? query.next : '/');

  return (
    <div className="auth-page relative min-h-[calc(100vh-84px)] flex items-center justify-center overflow-hidden bg-slate-900 px-4 py-10 sm:px-6">
      {/* Fondo con la imagen del home (hero-bg.jpg) + overlay degradado translúcido moderno */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Élite Club Stadium"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.45] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-sky-950/35 backdrop-blur-[6px]" />
        {/* Glow sutil en el fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />
      </div>

      {/* Tarjeta de Login centrada */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="auth-card w-full rounded-2xl border border-white/15 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-sky-950/40 backdrop-blur-2xl transition-all duration-300 hover:border-sky-500/30">
          {/* Cabecera */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image src="/images/elite-logo.png" alt="Élite Club" width={52} height={52} className="object-contain" priority />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('Iniciar sesión')}
            </h2>
            <p className="auth-switch-prompt text-xs sm:text-sm text-slate-400">
              {t('¿No tienes una cuenta?')}{' '}
              <Link
                href={`/register?next=${encodeURIComponent(nextPath)}`}
                className="auth-prompt-link ml-1"
              >
                {t('Regístrate aquí')}
              </Link>
            </p>
          </div>

          {nextPath !== '/' && (
            <div className="mb-5 rounded-xl border border-sky-500/30 bg-sky-950/40 p-3 text-xs text-sky-200 backdrop-blur-md flex items-center gap-2">
              <span className="text-sky-400 text-sm">ℹ</span>
              <span>{t('Inicia sesión para continuar con tu reserva seleccionada.')}</span>
            </div>
          )}

          {/* Formulario de Login */}
          <LoginForm nextPath={nextPath} oauthError={query.error === 'oauth'} />
        </div>
      </div>
    </div>
  );
}
