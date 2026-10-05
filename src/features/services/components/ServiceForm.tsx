"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Category } from "@/features/categories/types/category.types";
import { saveService, type ServiceFormState } from "@/features/services/api/service.actions";
import { weekDays, type Service } from "@/features/services/types/service.types";

const initialState: ServiceFormState = {};

interface ServiceFormProps {
  categories: Category[];
  service?: Service;
}

export function ServiceForm({ categories, service }: ServiceFormProps) {
  const [state, formAction, pending] = useActionState(saveService, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{service ? "Editar servicio" : "Nuevo servicio"}</h2>
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            name="name"
            defaultValue={service?.name}
            required
            minLength={3}
            maxLength={80}
            placeholder="Cancha 1"
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Categoría
          <select name="categoryId" defaultValue={service?.categoryId ?? ""} required className="rounded border px-3 py-2">
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {!category.isActive && " (inactiva)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Precio (COP)
          <input
            name="price"
            type="number"
            min={0}
            step="any"
            defaultValue={service?.price}
            required
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Duración de la reserva (minutos)
          <input
            name="durationMinutes"
            type="number"
            min={15}
            step={1}
            defaultValue={service?.durationMinutes ?? 60}
            required
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Capacidad máxima (1 = reserva individual)
          <input
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={service?.capacity ?? 1}
            required
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          URL de la imagen
          <input
            name="imageUrl"
            type="url"
            defaultValue={service?.imageUrl}
            placeholder="https://..."
            className="rounded border px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Descripción
        <textarea
          name="description"
          defaultValue={service?.description}
          maxLength={500}
          rows={3}
          className="rounded border px-3 py-2"
        />
      </label>

      <fieldset className="flex flex-wrap gap-3 text-sm">
        <legend className="mb-1">Días de operación</legend>
        {weekDays.map((day) => (
          <label key={day.value} className="flex items-center gap-1">
            <input
              type="checkbox"
              name="operatingDays"
              value={day.value}
              defaultChecked={service?.operatingDays.includes(day.value)}
            />
            {day.label}
          </label>
        ))}
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Servicio creado.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {service && (
          <Link href="/admin/services" className="rounded border px-4 py-2 text-sm">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
