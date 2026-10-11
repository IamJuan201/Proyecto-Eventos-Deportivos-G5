import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { listReservationsForUser } from "@/features/reservations/services/reservation.service";
import { redirect } from "next/navigation";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const dateText = (value: string, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(value + "T12:00:00-05:00"));

export default async function MyReservationsPage() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fmy-reservations");
  if (user.role !== "cliente") redirect(user.role === "admin" ? "/admin/metrics" : "/employee");
  const reservations = await listReservationsForUser(user.id);
  return (
    <main className="club-container reservations-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("TU HISTORIAL EN ÉLITE CLUB")}</span><h1>{t("Mis reservas.")}</h1><p>{t("Consulta el estado de tus turnos y vuelve a abrir tus códigos QR.")}</p></section>
      {!reservations.length && <div className="empty-state reservations-empty">{t("Todavía no tienes reservas.")} <Link href="/services">{t("Explora los espacios disponibles.")}</Link></div>}
      {!!reservations.length && <section className="reservation-list" aria-label={t("Resultados de búsqueda")}>
        {reservations.map((reservation) => (
          <Link className="glass-panel reservation-row reservation-row-link" key={reservation.id} href={"/checkout/" + reservation.id} aria-label={`${t(reservation.serviceName)} · ${dateText(reservation.date, locale)} · ${t(reservation.status.replace("_", " "))}`}>
            <div><span className="service-category">{dateText(reservation.date, locale)} · {reservation.startTime}—{reservation.endTime}</span><h3>{t(reservation.serviceName)}</h3><p>{reservation.people} {t("personas")} · {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(reservation.total)}</p></div>
            <div className="reservation-actions"><span className={"booking-status status-" + reservation.status}>{t(reservation.status.replace("_", " "))}</span><span className="reservation-cta">{t(reservation.status === "pendiente_pago" ? "Completar pago" : reservation.status === "pagada" ? "Ver reserva y QR" : "Ver detalle")}</span></div>
          </Link>
        ))}
      </section>}
    </main>
  );
}
