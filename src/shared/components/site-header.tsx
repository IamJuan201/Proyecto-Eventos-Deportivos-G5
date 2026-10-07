import Image from "next/image";
import Link from "next/link";
import { getJsonCurrentUser } from "@/features/auth/lib/json-auth";
import { UserMenuDropdown } from "@/shared/components/user-menu-dropdown";
import { ScrollProgressBar } from "@/shared/components/scroll-progress-bar";
import { MobileBottomNav } from "@/shared/components/mobile-bottom-nav";

export async function SiteHeader() {
  const user = await getJsonCurrentUser();
  const accountName = user?.fullName ?? user?.email ?? "Mi cuenta";
  const accountPath = user?.role === "admin" ? "/admin/metrics" : user?.role === "empleado" ? "/employee" : user ? "/my-reservations" : "/login";

  return (
    <>
      <header className="site-header">
        <div className="club-container site-header-inner">
          <Link href="/" aria-label="Élite Club, inicio" className="brand-lockup">
            <Image
              src="/images/logo.png"
              alt="Élite Club Logo"
              width={36}
              height={36}
              priority
              className="brand-logo-img"
            />
            <span className="brand-copy">
              <strong>ÉLITE CLUB</strong>
              <small>Deporte · bienestar</small>
            </span>
          </Link>

          <nav aria-label="Navegación principal de escritorio" className="site-nav">
            {!user || user.role === "cliente" ? (
              <>
                <Link href="/">Inicio</Link>
                <Link href="/services">Espacios</Link>
                <Link href="/my-reservations">Mis reservas</Link>
              </>
            ) : null}
            {user?.role === "admin" && <Link href="/admin/metrics">Panel admin</Link>}
            {user?.role === "empleado" && (
              <>
                <Link href="/employee">Mi actividad</Link>
                <Link href="/scanner">Escanear QR</Link>
              </>
            )}
          </nav>

          <div className="header-account">
            {user ? (
              /* Usuario logueado: texto blanco con el nombre + círculo avatar y menú desplegable */
              <UserMenuDropdown
                accountName={accountName}
                accountPath={accountPath}
                role={user.role}
                email={user.email}
              />
            ) : (
              /* Usuario no logueado: dos botones estilo moderno (Iniciar sesión + Registrarse) */
              <div className="flex items-center gap-2.5">
                <Link
                  className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-sky-300 transition-colors"
                  href="/login"
                >
                  Iniciar sesión
                </Link>
                <Link
                  className="rounded-full bg-white text-slate-900 px-4 py-2 text-xs font-bold shadow-md hover:bg-sky-400 hover:text-white transition-all duration-200"
                  href="/register"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progreso de lectura / scroll para PC */}
        <ScrollProgressBar />
      </header>

      {/* Barra de navegación inferior fija para celular */}
      <MobileBottomNav
        userRole={user?.role}
        accountPath={accountPath}
        accountLabel={user ? "Perfil" : "Entrar"}
      />
    </>
  );
}
