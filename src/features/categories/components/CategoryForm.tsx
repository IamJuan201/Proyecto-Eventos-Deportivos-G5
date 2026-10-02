"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCategory, type CategoryFormState } from "@/features/categories/api/category.actions";
import type { Category } from "@/features/categories/types/category.types";

const initialState: CategoryFormState = {};

export function CategoryForm({ category }: { category?: Category }) {
  const [state, formAction, pending] = useActionState(saveCategory, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{category ? "Editar categoría" : "Nueva categoría"}</h2>
      {category && <input type="hidden" name="id" value={category.id} />}

      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="name"
          defaultValue={category?.name}
          required
          minLength={3}
          maxLength={50}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Descripción
        <textarea
          name="description"
          defaultValue={category?.description}
          maxLength={200}
          rows={3}
          className="rounded border px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Categoría creada.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {category && (
          <Link href="/admin/categories" className="rounded border px-4 py-2 text-sm">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
