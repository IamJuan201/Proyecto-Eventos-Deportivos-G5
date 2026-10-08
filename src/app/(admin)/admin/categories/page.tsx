import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { CategoryList } from "@/features/categories/components/CategoryList";
import { categoryService } from "@/features/categories/services/category.service";

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { edit, error } = await searchParams;
  const categories = await categoryService.list();
  const editing = typeof edit === "string" ? await categoryService.getById(edit) : null;

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">CATÁLOGO DEL COMPLEJO</span>
        <h1>Categorías de espacios.</h1>
        <p>Organiza los espacios del complejo. Solo las categorías activas aparecen en el catálogo público.</p>
      </section>
      <nav className="admin-tabs" aria-label="Secciones de operación">
        <a href="/admin/categories" aria-current="page">Categorías</a>
        <a href="/admin/services">Servicios</a>
        <a href="/admin/schedules">Horarios</a>
        <a href="/admin/employees">Empleados</a>
        <a href="/admin/metrics">Métricas</a>
      </nav>
      {typeof error === "string" && <p className="booking-error">{error}</p>}
      <div className="admin-layout">
        <CategoryForm key={editing?.id ?? "new"} category={editing ?? undefined} />
        <CategoryList categories={categories} />
      </div>
    </main>
  );
}
