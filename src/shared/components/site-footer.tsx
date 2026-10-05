import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="club-container site-footer-inner">
        <div><strong>ÉLITE CLUB</strong><p>Tu espacio para moverte, competir y desconectar.</p></div>
        <nav aria-label="Enlaces de pie de página">
          <Link href="/services">Espacios</Link><Link href="/my-reservations">Mis reservas</Link><Link href="/scanner">Acceso empleados</Link><Link href="/admin/schedules">Operación</Link><Link href="/admin/metrics">Métricas</Link>
        </nav>
        <span className="demo-note">Demo funcional · Pagos simulados</span>
      </div>
    </footer>
  );
}
