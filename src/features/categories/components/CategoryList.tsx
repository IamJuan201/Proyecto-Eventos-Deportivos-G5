import Link from "next/link";
import { toggleCategoryStatus } from "@/features/categories/api/category.actions";
import { DeleteCategoryButton } from "@/features/categories/components/DeleteCategoryButton";
import type { Category } from "@/features/categories/types/category.types";
import { useTranslate } from "@/shared/i18n/locale-provider";

export function CategoryList({ categories }: { categories: Category[] }) {
  const t = useTranslate();
  return (
    <section className="glass-panel admin-list">
      <div className="admin-list-heading">
        <div>
          <h2>{t("Categorías registradas")}</h2>
          <p>{categories.filter((category) => category.isActive).length} {t("activas de")} {categories.length}</p>
        </div>
      </div>

      {categories.length ? (
        categories.map((category) => (
          <article className="employee-row" key={category.id}>
            <div className="employee-info">
              <strong>{t(category.name)}</strong>
              <small>{t(category.description || "Sin descripción")}</small>
            </div>
            <span className={"booking-status " + (category.isActive ? "" : "status-expirada")}>
              {t(category.isActive ? "Activa" : "Inactiva")}
            </span>
            <Link href={`/admin/categories?edit=${category.id}`} className="small-link">
              {t("Editar")}
            </Link>
            <form action={toggleCategoryStatus.bind(null, category.id, !category.isActive)}>
              <button type="submit" className="small-link">
                {t(category.isActive ? "Desactivar" : "Activar")}
              </button>
            </form>
            <DeleteCategoryButton id={category.id} name={category.name} />
          </article>
        ))
      ) : (
        <div className="empty-state">{t("Aún no hay categorías registradas.")}</div>
      )}
    </section>
  );
}
