import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { LogoutButton } from "@/features/auth/components/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const accountName = user?.fullName ?? user?.email ?? "Mi cuenta";
  const accountPath = user?.role === "admin" ? "/admin/metrics" : user?.role === "empleado" ? "/employee" : "/my-reservations";
  return (
    <header className="site-header">
      <div className="club-container site-header-inner">
        <Link href="/" aria-label="Élite Club, inicio" className="brand-lockup">
          <span aria-hidden="true" className="brand-mark">É</span>
          <span className="brand-copy"><strong>ÉLITE CLUB</strong><small>Deporte · bienestar</small></span>
        </Link>
        <nav aria-label="Navegación principal" className="site-nav">
          {!user || user.role === "cliente" ? <><Link href="/">Inicio</Link><Link href="/services">Espacios</Link><Link href="/my-reservations">Mis reservas</Link></> : null}
          {user?.role === "admin" && <Link href="/admin/metrics">Panel admin</Link>}
          {user?.role === "empleado" && <><Link href="/employee">Mi actividad</Link><Link href="/scanner">Escanear QR</Link></>}
        </nav>
        {user ? <div className="header-account"><Link className="club-button header-cta" href={accountPath}>{accountName}</Link><LogoutButton /></div> : <Link className="club-button header-cta" href="/login">Iniciar sesión <span aria-hidden="true">↗</span></Link>}
      </div>
    </header>
  );
}
