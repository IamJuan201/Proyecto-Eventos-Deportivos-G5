import { categoryService } from "@/features/categories/services/category.service";
import { ServiceForm } from "@/features/services/components/ServiceForm";
import { ServiceList } from "@/features/services/components/ServiceList";
import { serviceService } from "@/features/services/services/service.service";

export default async function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  const { edit, error } = await searchParams;
  const [services, categories] = await Promise.all([serviceService.list(), categoryService.list()]);
  const editing = typeof edit === "string" ? await serviceService.getById(edit) : null;

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">CATÁLOGO DEL COMPLEJO</span>
        <h1>Servicios y espacios.</h1>
        <p>Configura precio, capacidad, tipo de QR y días de operación de cada espacio reservable.</p>
      </section>
      <nav className="admin-tabs" aria-label="Secciones de operación">
        <a href="/admin/categories">Categorías</a>
        <a href="/admin/services" aria-current="page">Servicios</a>
        <a href="/admin/schedules">Horarios</a>
        <a href="/admin/employees">Empleados</a>
        <a href="/admin/metrics">Métricas</a>
      </nav>
      {typeof error === "string" && <p className="booking-error">{error}</p>}
      <div className="admin-layout">
        <ServiceForm key={editing?.id ?? "new"} categories={categories} service={editing ?? undefined} />
        <ServiceList services={services} categories={categories} />
      </div>
    </main>
  );
}
