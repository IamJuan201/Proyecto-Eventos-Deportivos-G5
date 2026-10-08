import Link from "next/link";
import type { Category } from "@/features/categories/types/category.types";
import { toggleServiceStatus } from "@/features/services/api/service.actions";
import { DeleteServiceButton } from "@/features/services/components/DeleteServiceButton";
import { weekDays, type Service } from "@/features/services/types/service.types";

const priceFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

interface ServiceListProps {
  services: Service[];
  categories: Category[];
}

export function ServiceList({ services, categories }: ServiceListProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <section className="glass-panel admin-list">
      <div className="admin-list-heading">
        <div>
          <h2>Servicios registrados</h2>
          <p>{services.filter((service) => service.isActive).length} activos de {services.length}</p>
        </div>
      </div>

      {services.length ? (
        services.map((service) => {
          const perPerson = service.chargeType === "por_persona";
          const days = weekDays
            .filter((day) => service.operatingDays.includes(day.value))
            .map((day) => day.label.slice(0, 2))
            .join(" · ");

          return (
            <article className="employee-row" key={service.id}>
              <div className="employee-info">
                <strong>{service.name}</strong>
                <small>
                  {categoryNames.get(service.categoryId) ?? "Sin categoría"} · {priceFormatter.format(service.price)} /{" "}
                  {perPerson ? "persona" : "hora"} · {service.capacity} {perPerson ? "cupos" : "espacios"} por turno ·
                  QR {service.qrType}
                </small>
                <small>{days}</small>
              </div>
              <span className={"booking-status " + (service.isActive ? "" : "status-expirada")}>
                {service.isActive ? "Activo" : "Inactivo"}
              </span>
              <Link href={`/admin/services?edit=${service.id}`} className="small-link">
                Editar
              </Link>
              <form action={toggleServiceStatus.bind(null, service.id, !service.isActive)}>
                <button type="submit" className="small-link">
                  {service.isActive ? "Desactivar" : "Activar"}
                </button>
              </form>
              <DeleteServiceButton id={service.id} name={service.name} />
            </article>
          );
        })
      ) : (
        <div className="empty-state">Aún no hay servicios registrados.</div>
      )}
    </section>
  );
}
