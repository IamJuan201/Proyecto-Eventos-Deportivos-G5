import { categoryService } from "@/features/categories/services/category.service";
import { ServiceForm } from "@/features/services/components/ServiceForm";
import { ServiceList } from "@/features/services/components/ServiceList";
import { serviceService } from "@/features/services/services/service.service";

export default async function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  const { edit } = await searchParams;
  const [services, categories] = await Promise.all([serviceService.list(), categoryService.list()]);
  const editing = typeof edit === "string" ? await serviceService.getById(edit) : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Servicios</h1>
      <ServiceForm key={editing?.id ?? "new"} categories={categories} service={editing ?? undefined} />
      <ServiceList services={services} categories={categories} />
    </main>
  );
}
