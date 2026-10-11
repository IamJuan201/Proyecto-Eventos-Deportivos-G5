import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { MobileBottomNav } from "@/shared/components/mobile-bottom-nav";
import { ScrollProgressBar } from "@/shared/components/scroll-progress-bar";
import { UserMenuDropdown } from "@/shared/components/user-menu-dropdown";
import { GuestHeaderControls } from "@/shared/components/guest-header-controls";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const accountName = user?.fullName ?? user?.email ?? "Mi cuenta";
  const accountPath = user?.role === "admin" ? "/admin/metrics" : user?.role === "empleado" ? "/employee" : user ? "/my-reservations" : "/login";
  return (
    <>
      <ScrollProgressBar />
      <header className="site-header">
        <div className="club-container site-header-inner">
          <Link href="/" aria-label="Élite Club, inicio" className="brand-lockup">
            <Image src="/images/elite-logo.png" alt="Élite Club" width={50} height={50} className="brand-logo-img" priority />
            <span className="brand-copy"><strong>ÉLITE CLUB</strong><small>{t("Deporte · bienestar")}</small></span>
          </Link>
          <nav aria-label="Navegación principal" className="site-nav">
            {!user || user.role === "cliente" ? <><Link href="/">{t("Inicio")}</Link><Link href="/services">{t("Espacios")}</Link><Link href="/my-reservations">{t("Mis reservas")}</Link></> : null}
            {user?.role === "admin" && <Link href="/admin/metrics">{t("Panel admin")}</Link>}
            {user?.role === "empleado" && <><Link href="/employee">{t("Mi actividad")}</Link><Link href="/scanner">{t("Escanear QR")}</Link></>}
          </nav>
          {user ? <div className="header-account"><LanguageSwitcher /><UserMenuDropdown accountName={accountName} accountPath={accountPath} role={user.role} email={user.email} /></div> : <GuestHeaderControls />}
        </div>
      </header>
      <MobileBottomNav userRole={user?.role} accountPath={accountPath} accountLabel={user ? "Cuenta" : "Entrar"} />
    </>
  );
}
