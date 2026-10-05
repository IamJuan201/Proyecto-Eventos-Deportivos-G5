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
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Eliminar
      </button>
    </form>
  );
}
