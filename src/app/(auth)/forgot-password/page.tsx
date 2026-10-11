import Link from "next/link";
import Image from "next/image";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);

  return (
    <div className="auth-page relative min-h-[calc(100vh-84px)] flex items-center justify-center overflow-hidden bg-slate-900 px-4 py-10 sm:px-6">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Élite Club Stadium"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.5] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-sky-950/35 backdrop-blur-[6px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <section className="auth-card rounded-2xl border border-white/15 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-sky-950/50 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
              <Image
                src="/images/elite-logo.png"
                alt="Élite Club"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
              {t("RECUPERA TU ACCESO")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("Volvamos a entrar.")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs">
              {t("Te enviaremos un enlace para crear una contraseña nueva.")}
            </p>
          </div>

          <PasswordResetForm mode="request" />

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              href="/login"
            >
              {t("Volver a iniciar sesión")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
