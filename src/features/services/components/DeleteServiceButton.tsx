"use client";

import { deleteService } from "@/features/services/api/service.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  const t = useTranslate();
  return (
    <form
      action={deleteService.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`${t("¿Eliminar el servicio")} "${name}"?`)) {
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
