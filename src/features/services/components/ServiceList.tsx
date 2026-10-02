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
  if (services.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay servicios registrados.</p>;
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b">
        <tr>
          <th className="py-2">Nombre</th>
          <th className="py-2">Categoría</th>
          <th className="py-2">Precio</th>
          <th className="py-2">Duración</th>
          <th className="py-2">Capacidad</th>
          <th className="py-2">Días</th>
          <th className="py-2">Estado</th>
          <th className="py-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {services.map((service) => (
          <tr key={service.id} className="border-b">
            <td className="py-2 font-medium">{service.name}</td>
            <td className="py-2">{categoryNames.get(service.categoryId) ?? "Sin categoría"}</td>
            <td className="py-2">{priceFormatter.format(service.price)}</td>
            <td className="py-2">{service.durationMinutes} min</td>
            <td className="py-2">{service.capacity === 1 ? "Individual" : `${service.capacity} cupos`}</td>
            <td className="py-2">
              {weekDays
                .filter((day) => service.operatingDays.includes(day.value))
                .map((day) => day.label.slice(0, 3))
                .join(", ")}
            </td>
            <td className="py-2">
              <span className={service.isActive ? "text-green-600" : "text-gray-400"}>
                {service.isActive ? "Activo" : "Inactivo"}
              </span>
            </td>
            <td className="flex gap-3 py-2">
              <Link href={`/admin/services?edit=${service.id}`} className="text-sm hover:underline">
                Editar
              </Link>
              <form action={toggleServiceStatus.bind(null, service.id, !service.isActive)}>
                <button type="submit" className="text-sm hover:underline">
                  {service.isActive ? "Desactivar" : "Activar"}
                </button>
              </form>
              <DeleteServiceButton id={service.id} name={service.name} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
