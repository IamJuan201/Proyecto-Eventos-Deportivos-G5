import Link from "next/link";
import Image from "next/image";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  return (
    <div className="auth-page relative min-h-[calc(100vh-70px)] flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 sm:px-6">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Élite Club Stadium"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.38] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-sky-950/40 backdrop-blur-[6px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <section className="auth-card rounded-2xl border border-white/15 bg-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
            {t("ACTUALIZA TU ACCESO")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {t("Una contraseña nueva.")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mb-6">
            {t("Elige una contraseña de al menos ocho caracteres.")}
          </p>

          <PasswordResetForm mode="update" />

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <Link
              className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
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
