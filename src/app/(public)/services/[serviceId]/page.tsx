import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/features/reservations/components/booking-form";
import { getDemoService, listDemoCategories, reservationDateBounds } from "@/shared/lib/demo-store";
import { getJsonCurrentUser } from "@/features/auth/lib/json-auth";

const symbols: Record<string, string> = { water: "〰", waves: "≈", slides: "≋", kids: "✦", fitness: "✣", wellness: "◌", football: "◈", micro: "▦", court: "⌗" };
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export default async function ServiceDetailPage({ params }: PageProps<"/services/[serviceId]">) {
  const { serviceId } = await params;
  const [service, categories] = await Promise.all([getDemoService(serviceId), listDemoCategories()]);
  if (!service || !service.isActive) notFound();
  const category = categories.find((item) => item.id === service.categoryId);
  const art = service.artwork || "court";
  const { min, max } = reservationDateBounds();
  const user = await getJsonCurrentUser();

  return (
    <main className="club-container">
      <div className="detail-back"><Link href="/services">← Volver a los espacios</Link><span>RESERVA EN LÍNEA · ÉLITE CLUB</span></div>
      <div className="detail-layout">
        <section className="glass-panel detail-panel">
          <div className={"service-art service-art-" + art + " detail-visual"}><span className="detail-symbol" aria-hidden="true">{symbols[art] ?? "✦"}</span><span className="eyebrow detail-tag">{service.tag}</span></div>
          <span className="eyebrow">{category?.name ?? "Élite Club"}</span>
          <h1>{service.name}</h1>
          <p className="detail-description">{service.description}</p>
          <div className="detail-facts"><span>{service.chargeType === "por_persona" ? "Cobro por persona" : "Cobro por hora"}</span><span>{service.qrType === "individual" ? "Un QR por persona" : "Un QR por reserva"}</span><span>Turnos de una hora</span></div>
          <div className="detail-price-block"><div><small>DESDE</small><strong>{money(service.price)}</strong><span> / {service.chargeType === "por_persona" ? "persona" : "hora"}</span></div><div><small>DISPONIBILIDAD</small><strong>{service.capacity}</strong><span> {service.chargeType === "por_persona" ? "cupos" : "espacios por turno"}</span></div></div>
          <div className="detail-note"><span>✦</span><p>Los lunes el complejo cierra por mantenimiento. Las reservas incluyen un QR digital válido durante el turno elegido.</p></div>
        </section>
        <section className="glass-panel detail-panel booking-panel" aria-labelledby="booking-title">
          <div className="booking-heading"><span className="eyebrow">RESERVA TU TURNO</span><h2 id="booking-title">Arma tu plan.</h2></div>
          <p>Selecciona una fecha y revisa los turnos disponibles en tiempo real.</p>
          {user?.role === "cliente" ? <BookingForm service={service} minDate={min} maxDate={max} /> : <div className="booking-login-prompt"><p>{user ? "La reserva está disponible desde una cuenta de cliente." : "Inicia sesión para reservar este espacio. Al entrar volverás aquí para elegir el horario y completar tu reserva."}</p><Link className="club-button" href={user ? (user.role === "admin" ? "/admin/metrics" : "/employee") : `/login?next=${encodeURIComponent(`/services/${service.id}`)}`}>{user ? "Ir a mi panel" : "Iniciar sesión para reservar"} <span aria-hidden="true">→</span></Link>{!user && <p className="field-hint">¿Primera vez en Élite Club? <Link href={`/register?next=${encodeURIComponent(`/services/${service.id}`)}`}>Crea tu cuenta</Link>.</p>}</div>}
        </section>
      </div>
    </main>
  );
}
