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
    <div className="relative min-h-[calc(100vh-70px)] flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
      {/* Fondo con la imagen del home (hero-bg.jpg) + overlay degradado translúcido moderno */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
            alt="Élite Club Stadium"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.38] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-sky-950/45 backdrop-blur-[6px]" />
        {/* Glow sutil en el fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />
      </div>

      {/* Tarjeta de Login centrada */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="w-full rounded-2xl border border-white/15 bg-slate-900/65 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 hover:border-sky-500/30">
          {/* Cabecera */}
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('Iniciar sesión')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('¿No tienes una cuenta?')}{' '}
              <Link
                href={`/register?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-white hover:text-sky-400 transition-colors ml-1"
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
