import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { CategoryList } from "@/features/categories/components/CategoryList";
import { categoryService } from "@/features/categories/services/category.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { edit, error } = await searchParams;
  const [categories, locale] = await Promise.all([categoryService.list(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const editing = typeof edit === "string" ? await categoryService.getById(edit) : null;

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">{t("CATÁLOGO DEL COMPLEJO")}</span>
        <h1>{t("Categorías de espacios.")}</h1>
        <p>{t("Organiza los espacios del complejo. Solo las categorías activas aparecen en el catálogo público.")}</p>
      </section>
      <nav className="admin-tabs" aria-label="Secciones de operación">
        <a href="/admin/categories" aria-current="page">{t("Categorías")}</a>
        <a href="/admin/services">{t("Servicios")}</a>
        <a href="/admin/schedules">{t("Horarios")}</a>
        <a href="/admin/employees">{t("Empleados")}</a>
        <a href="/admin/metrics">{t("Métricas")}</a>
      </nav>
      {typeof error === "string" && <p className="booking-error">{t(error)}</p>}
      <div className="admin-layout">
        <CategoryForm key={editing?.id ?? "new"} category={editing ?? undefined} />
        <CategoryList categories={categories} locale={locale} />
      </div>
    </main>
  );
}
