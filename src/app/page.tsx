import Link from "next/link";
import { ServiceCard } from "@/shared/components/service-card";
import { readDemoDatabase } from "@/shared/lib/demo-store";

export default async function HomePage() {
  const database = await readDemoDatabase();
  const categories = new Map(database.categories.map((category) => [category.id, category]));
  const services = database.services.filter((service) => service.isActive);
  const activeBookings = database.reservations.filter((booking) => booking.status === "pagada").length;

  return (
    <main>
      <section className="lobby-hero-banner">
        <div className="club-container lobby-hero">
          <div className="lobby-copy">
            <div className="hero-overline"><span className="live-dot" /> SANTUARIO DEPORTE &amp; BIENESTAR</div>
            <h1>Tu próximo<br /><span>gran momento</span><br />empieza aquí.</h1>
            <p>Entrena, compite y desconecta. Encuentra el espacio que va contigo en Élite Club.</p>
            <div className="hero-actions">
              <Link href="/services" className="club-button">Explorar espacios</Link>
              <Link href="/my-reservations" className="club-button club-button-secondary">Consultar mi reserva</Link>
            </div>
            <div className="hero-trust"><span>◉</span> Reserva en línea <i /> Pago de prueba <i /> Acceso QR</div>
          </div>
        </div>
      </section>

      <section className="club-container telemetry" aria-label="Estado del club">
        <div className="section-heading compact-heading"><div><span className="eyebrow">A TU RITMO</span><h2>El club, en movimiento.</h2></div><span className="sync-label"><span className="live-dot" /> DISPONIBLE HOY</span></div>
        <div className="telemetry-grid">
          <article className="glass-panel telemetry-card"><span className="telemetry-icon">⌖</span><span className="telemetry-label">Espacios listos</span><strong>{services.length.toString().padStart(2, "0")}<small> opciones</small></strong><span className="telemetry-detail">Deporte para cada momento</span></article>
          <article className="glass-panel telemetry-card"><span className="telemetry-icon cyan">◷</span><span className="telemetry-label">Horario del complejo</span><strong>08—17<small> h</small></strong><span className="telemetry-detail">Martes a domingo</span></article>
          <article className="glass-panel telemetry-card"><span className="telemetry-icon green">✳</span><span className="telemetry-label">Reservas confirmadas</span><strong>{activeBookings.toString().padStart(2, "0")}<small> este demo</small></strong><span className="telemetry-detail">Pago seguro de prueba</span></article>
        </div>
      </section>

      <section className="club-container featured-section">
        <div className="section-heading"><div><span className="eyebrow">ENCUENTRA TU ESPACIO</span><h2>Hoy se siente como <span>día de juego.</span></h2><p>Elige tu experiencia. Nosotros preparamos el resto.</p></div><Link href="/services" className="text-link">Ver todos los espacios</Link></div>
        <div className="service-grid">
          {services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} category={categories.get(service.categoryId)} />)}
        </div>
      </section>

      <section className="club-container flow-strip">
        <div><span className="eyebrow">SIN FILAS, SIN VUELTAS</span><h2>De tu pantalla<br />a la cancha.</h2></div>
        <div className="flow-steps">
          <div><span>01</span><strong>Elige tu espacio</strong><small>Fecha, turno y cupos.</small></div><i>·</i>
          <div><span>02</span><strong>Confirma tu reserva</strong><small>Paga en nuestro demo.</small></div><i>·</i>
          <div><span>03</span><strong>Entra con tu QR</strong><small>Listo para disfrutar.</small></div>
        </div>
      </section>
    </main>
  );
}
