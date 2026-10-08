import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { MobileBottomNav } from "@/shared/components/mobile-bottom-nav";
import { ScrollProgressBar } from "@/shared/components/scroll-progress-bar";
import { UserMenuDropdown } from "@/shared/components/user-menu-dropdown";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const accountName = user?.fullName ?? user?.email ?? "Mi cuenta";
  const accountPath = user?.role === "admin" ? "/admin/metrics" : user?.role === "empleado" ? "/employee" : user ? "/my-reservations" : "/login";
  return (
    <>
      <ScrollProgressBar />
      <header className="site-header">
        <div className="club-container site-header-inner">
          <Link href="/" aria-label="Élite Club, inicio" className="brand-lockup">
            <Image src="/images/logo.png" alt="" width={44} height={44} className="brand-logo-img" priority />
            <span className="brand-copy"><strong>ÉLITE CLUB</strong><small>Deporte · bienestar</small></span>
          </Link>
          <nav aria-label="Navegación principal" className="site-nav">
            {!user || user.role === "cliente" ? <><Link href="/">Inicio</Link><Link href="/services">Espacios</Link><Link href="/my-reservations">Mis reservas</Link></> : null}
            {user?.role === "admin" && <Link href="/admin/metrics">Panel admin</Link>}
            {user?.role === "empleado" && <><Link href="/employee">Mi actividad</Link><Link href="/scanner">Escanear QR</Link></>}
          </nav>
          {user ? <div className="header-account"><UserMenuDropdown accountName={accountName} accountPath={accountPath} role={user.role} email={user.email} /></div> : <Link className="club-button header-cta" href="/login">Iniciar sesión <span aria-hidden="true">↗</span></Link>}
        </div>
      </header>
      <MobileBottomNav userRole={user?.role} accountPath={accountPath} accountLabel={user ? "Cuenta" : "Entrar"} />
    </>
  );
}
