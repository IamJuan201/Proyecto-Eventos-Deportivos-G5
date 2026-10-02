"use client";

import { deleteService } from "@/features/services/api/service.actions";

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteService.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`¿Eliminar el servicio "${name}"?`)) {
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
