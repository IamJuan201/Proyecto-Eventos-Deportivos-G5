import Link from 'next/link';
import Image from 'next/image';
import { RegisterForm } from '@/features/auth/components/auth-forms';
import { getLocale } from '@/shared/i18n/locale.server';
import { translate } from '@/shared/i18n/messages';

const safeNextPath = (value: string | undefined) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/';

export default async function RegisterPage({ searchParams }: PageProps<'/register'>) {
  const query = await searchParams;
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const nextPath = safeNextPath(typeof query.next === 'string' ? query.next : '/');

  return (
    <div className="auth-page relative min-h-[calc(100vh-70px)] flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      {/* Fondo con la imagen del home (hero-bg.jpg) + overlay degradado translúcido moderno */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Élite Club Stadium"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 filter brightness-[0.4] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-sky-950/40 backdrop-blur-[6px]" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-sky-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-cyan-400/10 blur-[120px] pointer-events-none" />
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado izquierdo (PC): Bienvenida y branding con el azul cielo */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 backdrop-blur-md w-fit">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-sky-300">
              {t('Comunidad Atlética')}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-sky-500/20 bg-slate-900/80 p-1 flex items-center justify-center">
                <Image src="/images/logo.png" alt="Élite Club" width={40} height={40} className="object-cover rounded-xl" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {t('Únete a')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Élite Club</span>
              </h1>
            </div>

            <p className="text-2xl font-bold text-slate-100 leading-snug">
              {t('Crea tu cuenta y reserva')} <br />
              <span className="text-sky-400">{t('en solo unos pasos.')}</span>
            </p>

            <p className="text-sm text-slate-300/80 leading-relaxed max-w-md pt-1">
              {t('Disfruta de canchas de fútbol, piscinas olímpicas, zonas fitness y eventos exclusivos con reservas digitales inmediatas.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 backdrop-blur-md">
              <span className="text-sky-400 font-bold text-lg">✓</span>
              <p className="text-xs font-semibold text-slate-200 mt-1">{t('Sin costos ocultos')}</p>
              <p className="text-[11px] text-slate-400">{t('Tarifas transparentes')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 backdrop-blur-md">
              <span className="text-cyan-400 font-bold text-lg">✓</span>
              <p className="text-xs font-semibold text-slate-200 mt-1">{t('Gestión inmediata')}</p>
              <p className="text-[11px] text-slate-400">{t('Tus reservas siempre a mano')}</p>
            </div>
          </div>
        </div>

        {/* Lado derecho: Tarjeta de Registro translúcida */}
        <div className="w-full lg:col-span-6 flex justify-center">
          <div className="auth-card w-full max-w-md rounded-2xl border border-white/15 bg-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 hover:border-sky-500/30">
            <div className="text-center space-y-2 mb-6">
              <div className="lg:hidden flex justify-center mb-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-slate-900/80 p-1 flex items-center justify-center">
                  <Image src="/images/logo.png" alt="Élite Club" width={38} height={38} className="object-cover rounded-lg" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t('Crea tu cuenta')}
              </h2>
              <p className="auth-switch-prompt text-xs sm:text-sm text-slate-400">
                {t('¿Ya tienes una cuenta?')}{' '}
                <Link
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                  className="auth-prompt-link ml-1"
                >
                  {t('Iniciar sesión')}
                </Link>
              </p>
            </div>

            {nextPath !== '/' && (
              <div className="mb-5 rounded-xl border border-sky-500/30 bg-sky-950/40 p-3 text-xs text-sky-200 backdrop-blur-md">
                {t('Al crear tu cuenta podrás continuar con tu reserva de inmediato.')}
              </div>
            )}

            <RegisterForm nextPath={nextPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
