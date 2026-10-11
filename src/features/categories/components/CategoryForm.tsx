"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCategory, type CategoryFormState } from "@/features/categories/api/category.actions";
import type { Category } from "@/features/categories/types/category.types";
import { useTranslate } from "@/shared/i18n/locale-provider";

const initialState: CategoryFormState = {};

export function CategoryForm({ category }: { category?: Category }) {
  const t = useTranslate();
  const [state, formAction, pending] = useActionState(saveCategory, initialState);

  return (
    <form action={formAction} className="glass-panel admin-form">
      <h2>{t(category ? "Editar categoría" : "Nueva categoría")}</h2>
      <p>{t("Agrupa los espacios del complejo. Desactivarla los oculta del catálogo sin borrar el historial.")}</p>
      {category && <input type="hidden" name="id" value={category.id} />}

      <label>
        {t("Nombre")}
        <input
          className="club-input"
          name="name"
          defaultValue={category?.name}
          required
          minLength={3}
          maxLength={50}
          placeholder={t("Canchas")}
        />
      </label>

      <label>
        {t("Descripción")}
        <textarea
          className="club-input"
          name="description"
          defaultValue={category?.description}
          maxLength={200}
          rows={3}
          placeholder={t("Canchas deportivas")}
        />
      </label>

      {state.error && <p className="booking-error">{t(state.error)}</p>}
      {state.success && <p className="field-hint">{t("Categoría creada.")}</p>}

      <button className="club-button" type="submit" disabled={pending}>
        {pending ? t("Guardando...") : t("Guardar categoría")}
      </button>
      {category && (
        <Link href="/admin/categories" className="club-button club-button-secondary">
          {t("Cancelar")}
        </Link>
      )}
    </form>
  );
}
