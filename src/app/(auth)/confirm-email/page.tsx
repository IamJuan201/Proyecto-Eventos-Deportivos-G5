import Link from "next/link";
import Image from "next/image";
import { ConfirmEmailForm } from "@/features/auth/components/confirm-email-form";
import { getUsableEmailChange } from "@/features/auth/services/email-change.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function ConfirmEmailPage({ searchParams }: PageProps<"/confirm-email">) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  const [locale, newEmail] = await Promise.all([getLocale(), token ? getUsableEmailChange(token) : Promise.resolve(null)]);
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
            {t("TU CUENTA")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {t("Confirma tu nuevo correo.")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mb-6">
            {t("El cambio se aplica cuando confirmas desde este enlace.")}
          </p>

          {newEmail
            ? <ConfirmEmailForm token={token} email={newEmail} />
            : <div className="booking-error" role="alert">
              {t("El enlace no es válido o ya venció. Pide el cambio de nuevo desde tu perfil.")}{" "}
              <Link className="underline" href="/profile">{t("Ir a mi perfil")}</Link>
            </div>}
        </section>
      </div>
    </div>
  );
}
