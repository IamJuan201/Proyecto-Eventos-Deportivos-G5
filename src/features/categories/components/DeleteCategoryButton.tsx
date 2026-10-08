"use client";

import { deleteCategory } from "@/features/categories/api/category.actions";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCategory.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`¿Eliminar la categoría "${name}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="small-link">
        Eliminar
      </button>
    </form>
  );
}
