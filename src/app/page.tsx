import Link from "next/link";
import { ServiceCard } from "@/shared/components/service-card";
import { categoryService } from "@/features/categories/services/category.service";
import { serviceService } from "@/features/services/services/service.service";
import { getPrisma } from "@/shared/lib/prisma";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function HomePage() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const [allCategories, allServices, activeBookings] = await Promise.all([
    categoryService.list(),
    serviceService.list(),
    getPrisma().reserva.count({ where: { estado: "pagada" } }),
  ]);
  const categories = new Map(allCategories.map((category) => [category.id, category]));
  const services = allServices.filter((service) => service.isActive && categories.get(service.categoryId)?.isActive);

  return (
    <main>
      <section className="lobby-hero-banner">
      <div className="club-container lobby-hero">
        <div className="lobby-copy">
          <div className="hero-overline"><span className="live-dot" /> {t("SANTUARIO DEPORTE & BIENESTAR")}</div>
          <h1>{t("Tu próximo")}<br /><span>{t("gran momento")}</span><br />{t("empieza aquí.")}</h1>
          <p>{t("Entrena, compite y desconecta. Encuentra el espacio que va contigo en Élite Club.")}</p>
          <div className="hero-actions">
            <Link href="/services" className="club-button">{t("Explorar espacios")} <span aria-hidden="true">↗</span></Link>
            <Link href="/my-reservations" className="club-button club-button-secondary">{t("Consultar mi reserva")}</Link>
          </div>
          <div className="hero-trust"><span>◉</span> {t("Reserva en línea")} <i /> {t("Pago de prueba")} <i /> {t("Acceso QR")}</div>
        </div>
      </div>
      </section>

      <section className="club-container telemetry" aria-label="Estado del club">
        <div className="section-heading compact-heading"><div><span className="eyebrow">{t("A TU RITMO")}</span><h2>{t("El club, en movimiento.")}</h2></div><span className="sync-label"><span className="live-dot" /> {t("DISPONIBLE HOY")}</span></div>
        <div className="telemetry-grid">
          <article className="glass-panel telemetry-card"><span className="telemetry-icon">⌖</span><span className="telemetry-label">{t("Espacios listos")}</span><strong>{services.length.toString().padStart(2, "0")}<small> {t("opciones")}</small></strong><span className="telemetry-detail">{t("Deporte para cada momento")}</span></article>
          <article className="glass-panel telemetry-card"><span className="telemetry-icon cyan">◷</span><span className="telemetry-label">{t("Horario del complejo")}</span><strong>08—17<small> h</small></strong><span className="telemetry-detail">{t("Martes a domingo")}</span></article>
          <article className="glass-panel telemetry-card"><span className="telemetry-icon green">✳</span><span className="telemetry-label">{t("Reservas confirmadas")}</span><strong>{activeBookings.toString().padStart(2, "0")}<small> {t("este demo")}</small></strong><span className="telemetry-detail">{t("Pago seguro de prueba")}</span></article>
        </div>
      </section>

      <section className="club-container featured-section">
        <div className="section-heading"><div><span className="eyebrow">{t("ENCUENTRA TU ESPACIO")}</span><h2>{t("Hoy se siente como")} <span>{t("día de juego.")}</span></h2><p>{t("Elige tu experiencia. Nosotros preparamos el resto.")}</p></div><Link href="/services" className="text-link">{t("Ver todos los espacios")} <span>→</span></Link></div>
        <div className="service-grid">
          {services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} category={categories.get(service.categoryId)} />)}
        </div>
      </section>

      <section className="club-container flow-strip">
        <div><span className="eyebrow">{t("SIN FILAS, SIN VUELTAS")}</span><h2>{t("De tu pantalla")}<br />{t("a la cancha.")}</h2></div>
        <div className="flow-steps">
          <div><span>01</span><strong>{t("Elige tu espacio")}</strong><small>{t("Fecha, turno y cupos.")}</small></div><i>→</i>
          <div><span>02</span><strong>{t("Confirma tu reserva")}</strong><small>{t("Paga en nuestro demo.")}</small></div><i>→</i>
          <div><span>03</span><strong>{t("Entra con tu QR")}</strong><small>{t("Listo para disfrutar.")}</small></div>
        </div>
      </section>
    </main>
  );
}
