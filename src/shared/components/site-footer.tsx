import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
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
              <small>Deporte · bienestar</small>
            </span>
          </div>
          <p className="footer-tagline">
            Santuario deportivo y recreativo de alto rendimiento. Entrena, compite y desconecta a tu propio ritmo.
          </p>
        </div>

        <div className="footer-links-column">
          <span className="footer-column-title">Operación &amp; Gestión</span>
          <nav aria-label="Enlaces de gestión" className="footer-nav-list">
            <Link href="/scanner">Acceso de operadores</Link>
            <Link href="/admin/schedules">Horarios y cierres</Link>
            <Link href="/admin/metrics">Métricas operativas</Link>
          </nav>
        </div>

        <div className="footer-info-column">
          <span className="footer-column-title">Horario &amp; Política</span>
          <ul className="footer-info-list">
            <li><span>◷</span> Martes a Domingo: 08:00 — 17:00</li>
            <li><span>◉</span> Reservas hasta con 15 días de antelación</li>
            <li><span>⚡</span> Validación de ingreso mediante código QR</li>
          </ul>
        </div>
      </div>

      <div className="club-container footer-bottom-bar">
        <p>© 2026 Élite Club. Todos los derechos reservados.</p>
        <span className="demo-note">Plataforma demostrativa · Pagos simulados de prueba</span>
      </div>
    </footer>
  );
}
