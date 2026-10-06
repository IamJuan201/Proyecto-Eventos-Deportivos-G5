import Link from "next/link";
import { toggleCategoryStatus } from "@/features/categories/api/category.actions";
import { DeleteCategoryButton } from "@/features/categories/components/DeleteCategoryButton";
import type { Category } from "@/features/categories/types/category.types";

export function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <section className="glass-panel admin-list">
      <div className="admin-list-heading">
        <div>
          <h2>Categorías registradas</h2>
          <p>{categories.filter((category) => category.isActive).length} activas de {categories.length}</p>
        </div>
      </div>

      {categories.length ? (
        categories.map((category) => (
          <article className="employee-row" key={category.id}>
            <div className="employee-info">
              <strong>{category.name}</strong>
              <small>{category.description || "Sin descripción"}</small>
            </div>
            <span className={"booking-status " + (category.isActive ? "" : "status-expirada")}>
              {category.isActive ? "Activa" : "Inactiva"}
            </span>
            <Link href={`/admin/categories?edit=${category.id}`} className="small-link">
              Editar
            </Link>
            <form action={toggleCategoryStatus.bind(null, category.id, !category.isActive)}>
              <button type="submit" className="small-link">
                {category.isActive ? "Desactivar" : "Activar"}
              </button>
            </form>
            <DeleteCategoryButton id={category.id} name={category.name} />
          </article>
        ))
      ) : (
        <div className="empty-state">Aún no hay categorías registradas.</div>
      )}
    </section>
  );
}
