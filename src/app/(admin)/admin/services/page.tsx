import { categoryService } from "@/features/categories/services/category.service";
import { AdminTabs } from "@/shared/components/admin-tabs";
import { ServiceForm } from "@/features/services/components/ServiceForm";
import { ServiceList } from "@/features/services/components/ServiceList";
import { serviceService } from "@/features/services/services/service.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  const { edit, error } = await searchParams;
  const [services, categories, locale] = await Promise.all([serviceService.list(), categoryService.list(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const editing = typeof edit === "string" ? await serviceService.getById(edit) : null;

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">{t("CATÁLOGO DEL COMPLEJO")}</span>
        <h1>{t("Servicios y espacios.")}</h1>
        <p>{t("Configura precio, capacidad, tipo de QR y días de operación de cada espacio reservable.")}</p>
      </section>
      <AdminTabs active="/admin/services" />
      {typeof error === "string" && <p className="booking-error">{t(error)}</p>}
      <div className="admin-layout">
        <ServiceForm key={editing?.id ?? "new"} categories={categories} service={editing ?? undefined} />
        <ServiceList services={services} categories={categories} />
      </div>
    </main>
  );
}
