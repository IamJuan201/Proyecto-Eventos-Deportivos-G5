"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/lib/session";
import { createClosure, deactivateClosure } from "@/features/schedules/services/closure.service";

const SCHEDULES_PATH = "/admin/schedules";

export async function createClosureAction(formData: FormData) {
  const admin = await requireRole("admin");
  try {
    await createClosure({
      serviceId: String(formData.get("serviceId") ?? ""),
      from: String(formData.get("from") ?? ""),
      to: String(formData.get("to") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      type: String(formData.get("type") ?? ""),
      createdBy: admin.id,
    });
  } catch (error) {
    redirect(SCHEDULES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : "No se pudo registrar el cierre."));
  }
  revalidatePath(SCHEDULES_PATH);
  redirect(SCHEDULES_PATH);
}

export async function deleteClosureAction(formData: FormData) {
  await requireRole("admin");
  try {
    await deactivateClosure(String(formData.get("id") ?? ""));
  } catch (error) {
    redirect(SCHEDULES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : "No se pudo eliminar el cierre."));
  }
  revalidatePath(SCHEDULES_PATH);
}
