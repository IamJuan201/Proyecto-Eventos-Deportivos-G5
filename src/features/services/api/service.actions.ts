"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serviceService } from "@/features/services/services/service.service";
import type { ChargeType, QrType, ServiceInput, WeekDay } from "@/features/services/types/service.types";
import { requireDemoRole } from "@/features/auth/lib/json-auth";

const SERVICES_PATH = "/admin/services";

export type ServiceFormState = { error?: string; success?: boolean };

export async function saveService(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await requireDemoRole("admin");
  const id = String(formData.get("id") ?? "");
  const input: ServiceInput = {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: Number(formData.get("price")),
    durationMinutes: Number(formData.get("durationMinutes")),
    capacity: Number(formData.get("capacity")),
    capacityPeople: Number(formData.get("capacityPeople")),
    chargeType: String(formData.get("chargeType") ?? "") as ChargeType,
    qrType: String(formData.get("qrType") ?? "") as QrType,
    operatingDays: formData.getAll("operatingDays").map((day) => Number(day) as WeekDay),
  };

  try {
    if (id) {
      await serviceService.update(id, input);
    } else {
      await serviceService.create(input);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el servicio." };
  }

  revalidatePath(SERVICES_PATH);
  if (id) {
    redirect(SERVICES_PATH);
  }
  return { success: true };
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  await requireDemoRole("admin");
  try {
    await serviceService.setActive(id, isActive);
  } catch (error) {
    redirectWithError(error, "No se pudo cambiar el estado del servicio.");
  }
  revalidatePath(SERVICES_PATH);
}

export async function deleteService(id: string) {
  await requireDemoRole("admin");
  try {
    await serviceService.delete(id);
  } catch (error) {
    redirectWithError(error, "No se pudo eliminar el servicio.");
  }
  revalidatePath(SERVICES_PATH);
}

function redirectWithError(error: unknown, fallback: string): never {
  redirect(SERVICES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : fallback));
}
