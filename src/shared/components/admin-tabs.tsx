import Link from "next/link";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const TABS = [
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/schedules", label: "Horarios" },
  { href: "/admin/employees", label: "Empleados" },
  { href: "/admin/metrics", label: "Métricas" },
] as const;

/** Section tabs shared by every admin page; `active` is the current page's path. */
export async function AdminTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  const locale = await getLocale();
  return (
    <nav className="admin-tabs" aria-label={translate("Secciones de operación", locale)}>
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={tab.href === active ? "page" : undefined}>{translate(tab.label, locale)}</Link>
      ))}
    </nav>
  );
}
