"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslate } from "@/shared/i18n/locale-provider";

type Role = "guest" | "cliente" | "empleado" | "admin";

const LINKS: Record<Role, { href: string; label: string; also?: string[] }[]> = {
  guest: [{ href: "/", label: "Inicio" }, { href: "/services", label: "Espacios" }],
  cliente: [{ href: "/", label: "Inicio" }, { href: "/services", label: "Espacios" }, { href: "/my-reservations", label: "Mis reservas", also: ["/checkout"] }],
  empleado: [{ href: "/employee", label: "Mi actividad" }, { href: "/scanner", label: "Escanear QR" }],
  admin: [{ href: "/admin/metrics", label: "Panel admin", also: ["/admin"] }, { href: "/services", label: "Ver catálogo" }],
};

const matches = (pathname: string, prefix: string) => (prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix + "/"));

/** Desktop header links for the signed-in role, with the current section marked. */
export function HeaderNav({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const t = useTranslate();
  const key: Role = role === "admin" || role === "empleado" || role === "cliente" ? role : "guest";
  const links = LINKS[key];
  const active = links.find((link) => [link.href, ...(link.also ?? [])].some((prefix) => matches(pathname, prefix)));
  return (
    <nav aria-label={t("Navegación principal")} className="site-nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={link === active ? "active" : undefined} aria-current={link === active ? "page" : undefined}>{t(link.label)}</Link>
      ))}
    </nav>
  );
}
