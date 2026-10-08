import Link from "next/link";
import { ServiceCard } from "@/shared/components/service-card";
import { categoryService } from "@/features/categories/services/category.service";
import { serviceService } from "@/features/services/services/service.service";
import { getPrisma } from "@/shared/lib/prisma";

export default async function HomePage() {
  const [allCategories, allServices, activeBookings] = await Promise.all([
    categoryService.list(),
    serviceService.list(),
    getPrisma().reserva.count({ where: { estado: "pagada" } }),
  ]);
  const categories = new Map(allCategories.map((category) => [category.id, category]));
  const services = allServices.filter((service) => service.isActive && categories.get(service.categoryId)?.isActive);

  return (
    <main>
      <section className="club-container lobby-hero">
        <div className="lobby-copy">
          <div className="hero-overline"><span className="live-dot" /> SANTUARIO DEPORTE &amp; BIENESTAR</div>
          <h1>Tu próximo<br /><span>gran momento</span><br />empieza aquí.</h1>
          <p>Entrena, compite y desconecta. Encuentra el espacio que va contigo en Élite Club.</p>
          <div className="hero-actions">
            <Link href="/services" className="club-button">Explorar espacios <span aria-hidden="true">↗</span></Link>
            <Link href="/my-reservations" className="club-button club-button-secondary">Consultar mi reserva</Link>
          </div>
          <div className="hero-trust"><span>◉</span> Reserva en línea <i /> Pago de prueba <i /> Acceso QR</div>
        </div>
        <div className="hero-visual" aria-label="Ilustración de una cancha iluminada al anochecer">
          <div className="hero-glow" />
          <div className="court-illustration">
            <svg viewBox="0 0 600 560" role="img" aria-label="Cancha deportiva iluminada">
              <defs><linearGradient id="court" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#163a4d" /><stop offset="1" stopColor="#101923" /></linearGradient><linearGradient id="light" x1="0" x2="1"><stop stopColor="#80d0ff" stopOpacity=".7" /><stop offset="1" stopColor="#138dff" stopOpacity=".06" /></linearGradient></defs>
              <path d="M76 540 191 84 519 12 448 540Z" fill="url(#court)" stroke="#6fc5ff" strokeOpacity=".35" />
              <path d="m191 84 257 456M76 540 519 12M134 313l354-169M169 174l334 190" fill="none" stroke="#a9dbff" strokeOpacity=".34" strokeWidth="2" />
              <path d="M270 67 342 0M465 123l112-79" stroke="url(#light)" strokeWidth="12" />
              <path d="M289 24 79 535M515 16 448 539" stroke="url(#light)" strokeWidth="24" opacity=".28" />
              <circle cx="303" cy="312" r="65" fill="none" stroke="#b9e2ff" strokeOpacity=".25" strokeWidth="2" />
              <path d="M106 430h372M148 252h357" stroke="#b9e2ff" strokeOpacity=".2" strokeDasharray="4 8" />
            </svg>
          </div>
          <div className="visual-label visual-label-top"><span className="live-dot" /> CLUB STATUS <b>OPERATIVO</b></div>
          <div className="visual-label visual-label-bottom"><strong>01 / 04</strong><span>ESPACIOS PARA TU PRÓXIMO PLAN</span></div>
          <div className="visual-stamp">EC<br /><small>PRIVÉ</small></div>
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
        <div className="section-heading"><div><span className="eyebrow">ENCUENTRA TU ESPACIO</span><h2>Hoy se siente como <span>día de juego.</span></h2><p>Elige tu experiencia. Nosotros preparamos el resto.</p></div><Link href="/services" className="text-link">Ver todos los espacios <span>→</span></Link></div>
        <div className="service-grid">
          {services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} category={categories.get(service.categoryId)} />)}
        </div>
      </section>

      <section className="club-container flow-strip">
        <div><span className="eyebrow">SIN FILAS, SIN VUELTAS</span><h2>De tu pantalla<br />a la cancha.</h2></div>
        <div className="flow-steps">
          <div><span>01</span><strong>Elige tu espacio</strong><small>Fecha, turno y cupos.</small></div><i>→</i>
          <div><span>02</span><strong>Confirma tu reserva</strong><small>Paga en nuestro demo.</small></div><i>→</i>
          <div><span>03</span><strong>Entra con tu QR</strong><small>Listo para disfrutar.</small></div>
        </div>
      </section>
    </main>
  );
}
