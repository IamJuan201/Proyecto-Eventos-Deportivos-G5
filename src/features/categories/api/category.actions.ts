"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoryService } from "@/features/categories/services/category.service";
import { requireDemoRole } from "@/features/auth/lib/json-auth";

const CATEGORIES_PATH = "/admin/categories";

export type CategoryFormState = { error?: string; success?: boolean };

export async function saveCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireDemoRole("admin");
  const id = String(formData.get("id") ?? "");
  const input = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };

  try {
    if (id) {
      await categoryService.update(id, input);
    } else {
      await categoryService.create(input);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la categoría." };
  }

  revalidatePath(CATEGORIES_PATH);
  if (id) {
    redirect(CATEGORIES_PATH);
  }
  return { success: true };
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  await requireDemoRole("admin");
  try {
    await categoryService.setActive(id, isActive);
  } catch (error) {
    redirectWithError(error, "No se pudo cambiar el estado de la categoría.");
  }
  revalidatePath(CATEGORIES_PATH);
}

export async function deleteCategory(id: string) {
  await requireDemoRole("admin");
  try {
    await categoryService.delete(id);
  } catch (error) {
    redirectWithError(error, "No se pudo eliminar la categoría.");
  }
  revalidatePath(CATEGORIES_PATH);
}

function redirectWithError(error: unknown, fallback: string): never {
  redirect(CATEGORIES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : fallback));
}
