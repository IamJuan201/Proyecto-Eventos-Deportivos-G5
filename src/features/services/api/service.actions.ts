"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serviceService, ServiceValidationError } from "@/features/services/services/service.service";
import type { ServiceInput, WeekDay } from "@/features/services/types/service.types";
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
    operatingDays: formData.getAll("operatingDays").map((day) => Number(day) as WeekDay),
  };

  try {
    if (id) {
      await serviceService.update(id, input);
    } else {
      await serviceService.create(input);
    }
  } catch (error) {
    if (error instanceof ServiceValidationError) {
      return { error: error.message };
    }
    return { error: "No se pudo guardar el servicio." };
  }

  revalidatePath(SERVICES_PATH);
  if (id) {
    redirect(SERVICES_PATH);
  }
  return { success: true };
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  await requireDemoRole("admin");
  await serviceService.setActive(id, isActive);
  revalidatePath(SERVICES_PATH);
}

export async function deleteService(id: string) {
  await requireDemoRole("admin");
  await serviceService.delete(id);
  revalidatePath(SERVICES_PATH);
}
