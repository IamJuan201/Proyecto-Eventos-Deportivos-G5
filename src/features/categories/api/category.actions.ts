"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoryService, CategoryValidationError } from "@/features/categories/services/category.service";
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
    if (error instanceof CategoryValidationError) {
      return { error: error.message };
    }
    return { error: "No se pudo guardar la categoría." };
  }

  revalidatePath(CATEGORIES_PATH);
  if (id) {
    redirect(CATEGORIES_PATH);
  }
  return { success: true };
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  await requireDemoRole("admin");
  await categoryService.setActive(id, isActive);
  revalidatePath(CATEGORIES_PATH);
}

export async function deleteCategory(id: string) {
  await requireDemoRole("admin");
  await categoryService.delete(id);
  revalidatePath(CATEGORIES_PATH);
}
