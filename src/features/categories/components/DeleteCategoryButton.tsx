"use client";

import { deleteCategory } from "@/features/categories/api/category.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const t = useTranslate();
  return (
    <form
      action={deleteCategory.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`${t("¿Eliminar la categoría")} "${name}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="small-link">
        {t("Eliminar")}
      </button>
    </form>
  );
}
