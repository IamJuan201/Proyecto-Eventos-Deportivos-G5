import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/features/reservations/components/booking-form";
import { getCurrentUser } from "@/features/auth/lib/session";
import { categoryService } from "@/features/categories/services/category.service";
import { serviceService } from "@/features/services/services/service.service";
import { reservationDateBounds } from "@/shared/lib/bogota-time";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const symbols: Record<string, string> = { water: "〰", waves: "≈", slides: "≋", kids: "✦", fitness: "✣", wellness: "◌", football: "◈", micro: "▦", court: "⌗" };
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export default async function ServiceDetailPage({ params }: PageProps<"/services/[serviceId]">) {
  const { serviceId } = await params;
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const service = await serviceService.getById(serviceId);
  if (!service || !service.isActive) notFound();
  const category = await categoryService.getById(service.categoryId);
  if (!category?.isActive) notFound();
  const art = service.icon;
  const { min, max } = reservationDateBounds();
  const user = await getCurrentUser();

  return (
    <main className="club-container">
      <div className="detail-back"><Link href="/services">← {t("Volver a los espacios")}</Link><span>{t("RESERVA EN LÍNEA · ÉLITE CLUB")}</span></div>
      <div className="detail-layout">
        <section className="glass-panel detail-panel">
          <div className={"service-art service-art-" + art + " detail-visual"}><span className="detail-symbol" aria-hidden="true">{symbols[art] ?? "✦"}</span><span className="eyebrow detail-tag">{t(service.tag)}</span></div>
          <span className="eyebrow">{t(category?.name ?? "Élite Club")}</span>
          <h1>{t(service.name)}</h1>
          <p className="detail-description">{t(service.description)}</p>
          <div className="detail-facts"><span>{t(service.chargeType === "por_persona" ? "Cobro por persona" : "Cobro por hora")}</span><span>{t(service.qrType === "individual" ? "Un QR por persona" : "Un QR por reserva")}</span><span>{t("Turnos de una hora")}</span></div>
          <div className="detail-price-block"><div><small>{t("DESDE")}</small><strong>{money(service.price)}</strong><span> / {t(service.chargeType === "por_persona" ? "persona" : "hora")}</span></div><div><small>{t("DISPONIBILIDAD")}</small><strong>{service.capacity}</strong><span> {t(service.chargeType === "por_persona" ? "cupos" : "espacios por turno")}</span></div></div>
          <div className="detail-note"><span>✦</span><p>{t("Los lunes el complejo cierra por mantenimiento. Las reservas incluyen un QR digital válido durante el turno elegido.")}</p></div>
        </section>
        <section className="glass-panel detail-panel booking-panel" aria-labelledby="booking-title">
          <div className="booking-heading"><span className="eyebrow">{t("RESERVA TU TURNO")}</span><h2 id="booking-title">{t("Arma tu plan.")}</h2></div>
          <p>{t("Selecciona una fecha y revisa los turnos disponibles en tiempo real.")}</p>
          {user?.role === "cliente" ? <BookingForm service={service} minDate={min} maxDate={max} /> : <div className="booking-login-prompt"><p>{t(user ? "La reserva está disponible desde una cuenta de cliente." : "Inicia sesión para reservar este espacio. Al entrar volverás aquí para elegir el horario y completar tu reserva.")}</p><Link className="club-button" href={user ? (user.role === "admin" ? "/admin/metrics" : "/employee") : `/login?next=${encodeURIComponent(`/services/${service.id}`)}`}>{user ? t("Ir a mi panel") : t("Iniciar sesión para reservar")}</Link>{!user && <p className="field-hint">{t("¿Primera vez en Élite Club?")} <Link href={`/register?next=${encodeURIComponent(`/services/${service.id}`)}`}>{t("Crea tu cuenta")}</Link>.</p>}</div>}
        </section>
      </div>
    </main>
  );
}
