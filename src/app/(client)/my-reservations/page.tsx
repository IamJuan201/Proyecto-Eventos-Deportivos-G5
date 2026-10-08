import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { listReservationsForUser } from "@/features/reservations/services/reservation.service";
import { redirect } from "next/navigation";

const dateText = (value: string) => new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(value + "T12:00:00-05:00"));

export default async function MyReservationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fmy-reservations");
  if (user.role !== "cliente") redirect(user.role === "admin" ? "/admin/metrics" : "/employee");
  const reservations = await listReservationsForUser(user.id);
  return (
    <main className="club-container reservations-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">TU HISTORIAL EN ÉLITE CLUB</span><h1>Mis reservas.</h1><p>Consulta el estado de tus turnos y vuelve a abrir tus códigos QR.</p></section>
      {!reservations.length && <div className="empty-state reservations-empty">Todavía no tienes reservas. <Link href="/services">Explora los espacios disponibles.</Link></div>}
      {!!reservations.length && <section className="reservation-list" aria-label="Resultados de búsqueda">
        {reservations.map((reservation) => (
          <article className="glass-panel reservation-row" key={reservation.id}>
            <div><span className="service-category">{dateText(reservation.date)} · {reservation.startTime}—{reservation.endTime}</span><h3>{reservation.serviceName}</h3><p>{reservation.people} personas · {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(reservation.total)}</p></div>
            <div className="reservation-actions"><span className={"booking-status status-" + reservation.status}>{reservation.status.replace("_", " ")}</span><Link className="small-link" href={"/checkout/" + reservation.id}>{reservation.status === "pendiente_pago" ? "Completar pago" : reservation.status === "pagada" ? "Ver reserva y QR" : "Ver detalle"}</Link></div>
          </article>
        ))}
      </section>}
    </main>
  );
}
