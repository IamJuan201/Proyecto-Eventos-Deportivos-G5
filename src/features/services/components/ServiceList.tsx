import Link from "next/link";
import type { Category } from "@/features/categories/types/category.types";
import { toggleServiceStatus } from "@/features/services/api/service.actions";
import { DeleteServiceButton } from "@/features/services/components/DeleteServiceButton";
import { weekDays, type Service } from "@/features/services/types/service.types";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const priceFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

interface ServiceListProps {
  services: Service[];
  categories: Category[];
}

export async function ServiceList({ services, categories }: ServiceListProps) {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <section className="glass-panel admin-list">
      <div className="admin-list-heading">
        <div>
          <h2>{t("Servicios registrados")}</h2>
          <p>{services.filter((service) => service.isActive).length} {t("activos de")} {services.length}</p>
        </div>
      </div>

      {services.length ? (
        services.map((service) => {
          const perPerson = service.chargeType === "por_persona";
          const days = weekDays
            .filter((day) => service.operatingDays.includes(day.value))
            .map((day) => t(day.label).slice(0, 2))
            .join(" · ");

          return (
            <article className="employee-row service-admin-row" key={service.id}>
              <div className="employee-info">
                <strong>{t(service.name)}</strong>
                <small>
                  {t(categoryNames.get(service.categoryId) ?? "Sin categoría")} · {priceFormatter.format(service.price)} /{" "}
                  {t(perPerson ? "persona" : "hora")} · {service.capacity} {t(perPerson ? "cupos" : "espacios")} {t("por turno")} ·
                  QR {t(service.qrType)}
                </small>
                <small>{days}</small>
              </div>
              <form action={toggleServiceStatus.bind(null, service.id, !service.isActive)} className="service-status-form">
                <button
                  type="submit"
                  className={`booking-status service-status-control${service.isActive ? "" : " status-expirada"}`}
                  aria-label={`${t(service.isActive ? "Desactivar servicio" : "Activar servicio")}: ${service.name}`}
                >
                  {t(service.isActive ? "Activo" : "Inactivo")}
                </button>
              </form>
              <Link href={`/admin/services?edit=${service.id}`} className="small-link service-action service-action-edit">
                {t("Editar")}
              </Link>
              <DeleteServiceButton id={service.id} name={service.name} />
            </article>
          );
        })
      ) : (
        <div className="empty-state">{t("Aún no hay servicios registrados.")}</div>
      )}
    </section>
  );
}
