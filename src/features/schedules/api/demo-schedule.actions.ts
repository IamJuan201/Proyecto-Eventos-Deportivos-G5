"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDemoClosure, deleteDemoClosure } from "@/shared/lib/demo-store";
import { requireDemoRole } from "@/features/auth/lib/json-auth";

export async function createDemoClosureAction(formData: FormData) {
  await requireDemoRole("admin");
  try {
    await createDemoClosure({
      serviceId: String(formData.get("serviceId") ?? ""),
      from: String(formData.get("from") ?? ""),
      to: String(formData.get("to") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
  } catch (error) {
    redirect("/admin/schedules?error=" + encodeURIComponent(error instanceof Error ? error.message : "No se pudo registrar el cierre."));
  }
  revalidatePath("/admin/schedules");
  redirect("/admin/schedules");
}

export async function deleteDemoClosureAction(formData: FormData) {
  await requireDemoRole("admin");
  await deleteDemoClosure(Number(formData.get("index")));
  revalidatePath("/admin/schedules");
}
