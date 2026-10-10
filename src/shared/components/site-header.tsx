import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/lib/session";
import { HeaderNav } from "@/shared/components/header-nav";
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
  return (
    <>
      <ScrollProgressBar />
      <header className="site-header">
        <div className="club-container site-header-inner">
          <Link href="/" aria-label="Élite Club, inicio" className="brand-lockup">
            <Image src="/images/logo.png" alt="" width={44} height={44} className="brand-logo-img" priority />
            <span className="brand-copy"><strong>ÉLITE CLUB</strong><small>{t("Deporte · bienestar")}</small></span>
          </Link>
          <HeaderNav role={user?.role} />
          {user ? <div className="header-account"><LanguageSwitcher /><UserMenuDropdown accountName={accountName} role={user.role} email={user.email} /></div> : <GuestHeaderControls />}
        </div>
      </header>
      <MobileBottomNav userRole={user?.role} />
    </>
  );
}
