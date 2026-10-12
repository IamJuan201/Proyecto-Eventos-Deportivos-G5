"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslate } from "@/shared/i18n/locale-provider";

type IconName = "home" | "spaces" | "calendar" | "activity" | "scan" | "chart" | "catalog" | "clock" | "team" | "user";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Extra route prefixes that also mark this item as active. */
  also?: string[];
}

/** One destination per item and at most five per role, so nothing is squeezed or duplicated. */
const NAV_BY_ROLE: Record<"guest" | "cliente" | "empleado" | "admin", NavItem[]> = {
  guest: [
    { href: "/", label: "Inicio", icon: "home" },
    { href: "/services", label: "Espacios", icon: "spaces" },
    { href: "/login", label: "Entrar", icon: "user", also: ["/register", "/forgot-password", "/reset-password", "/verify-email"] },
  ],
  cliente: [
    { href: "/", label: "Inicio", icon: "home" },
    { href: "/services", label: "Espacios", icon: "spaces" },
    { href: "/my-reservations", label: "Reservas", icon: "calendar", also: ["/checkout"] },
    { href: "/profile", label: "Perfil", icon: "user" },
  ],
  empleado: [
    { href: "/employee", label: "Actividad", icon: "activity" },
    { href: "/scanner", label: "Escanear", icon: "scan" },
    { href: "/profile", label: "Perfil", icon: "user" },
  ],
  admin: [
    { href: "/admin/metrics", label: "Panel", icon: "chart" },
    { href: "/admin/services", label: "Catálogo", icon: "catalog", also: ["/admin/categories"] },
    { href: "/admin/schedules", label: "Agenda", icon: "clock" },
    { href: "/admin/employees", label: "Equipo", icon: "team" },
    { href: "/profile", label: "Perfil", icon: "user" },
  ],
};

const ICONS: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  spaces: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  activity: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></>,
  chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
  catalog: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  team: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
};

const matches = (pathname: string, prefix: string) => (prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix + "/"));

/** Bottom navigation for phones: items depend on the role and exactly one is active. */
export function MobileBottomNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();
  const t = useTranslate();
  const role = userRole === "admin" || userRole === "empleado" || userRole === "cliente" ? userRole : "guest";
  const items = NAV_BY_ROLE[role];
  const active = items.find((item) => [item.href, ...(item.also ?? [])].some((prefix) => matches(pathname, prefix)));

  return (
    <nav className="mobile-bottom-nav" aria-label={t("Navegación móvil inferior")}>
      {items.map((item) => {
        const isActive = item === active;
        return (
          <Link key={item.href} href={item.href} className={`mobile-nav-item${isActive ? " active" : ""}`} aria-current={isActive ? "page" : undefined}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[item.icon]}</svg>
            <span>{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
