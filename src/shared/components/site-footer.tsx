import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  return (
    <footer className="site-footer">
      <div className="club-container site-footer-inner">
        <div className="footer-brand-column">
          <div className="brand-lockup">
            <Image
              src="/images/logo.png"
              alt="Élite Club Logo"
              width={34}
              height={34}
              className="brand-logo-img"
            />
            <span className="brand-copy">
              <strong>ÉLITE CLUB</strong>
              <small>{t("Deporte · bienestar")}</small>
            </span>
          </div>
          <p className="footer-tagline">{t("Santuario deportivo y recreativo de alto rendimiento. Entrena, compite y desconecta a tu propio ritmo.")}</p>
        </div>

        <div className="footer-links-column">
          <span className="footer-column-title">{t("Explora Élite Club")}</span>
          <nav aria-label="Enlaces del sitio" className="footer-nav-list">
            <Link href="/services">{t("Espacios")}</Link>
            <Link href="/my-reservations">{t("Mis reservas")}</Link>
            <Link href="/login">{t("Iniciar sesión")}</Link>
            <Link href="/scanner">{t("Acceso de operadores")}</Link>
            <Link href="/admin/schedules">{t("Horarios y cierres")}</Link>
            <Link href="/admin/metrics">{t("Métricas operativas")}</Link>
          </nav>
        </div>

        <div className="footer-info-column">
          <span className="footer-column-title">{t("Horario & Política")}</span>
          <ul className="footer-info-list">
            <li><span>◷</span> {t("Martes a Domingo: 08:00 — 17:00")}</li>
            <li><span>◉</span> {t("Reservas hasta con 15 días de antelación")}</li>
            <li><span>⚡</span> {t("Validación de ingreso mediante código QR")}</li>
          </ul>
        </div>
      </div>

      <div className="club-container footer-bottom-bar">
        <p>© 2026 Élite Club. {t("Todos los derechos reservados.")}</p>
      </div>
    </footer>
  );
}
