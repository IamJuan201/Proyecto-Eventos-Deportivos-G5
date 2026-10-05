"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assignDemoEmployee, createDemoEmployeeAccount, setDemoEmployeeActive } from "@/shared/lib/demo-store";
import { hashPassword, requireDemoRole } from "@/features/auth/lib/json-auth";

export async function createDemoEmployeeAction(formData: FormData) {
  await requireDemoRole("admin");
  try {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) throw new Error("La contraseña inicial debe tener al menos 8 caracteres.");
    await createDemoEmployeeAccount({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    redirect("/admin/employees?error=" + encodeURIComponent(error instanceof Error ? error.message : "No se pudo guardar el empleado."));
  }
  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

export async function toggleDemoEmployeeAction(formData: FormData) {
  await requireDemoRole("admin");
  await setDemoEmployeeActive(String(formData.get("id") ?? ""), formData.get("isActive") === "true");
  revalidatePath("/admin/employees");
  revalidatePath("/employee");
  revalidatePath("/scanner");
}

export async function assignDemoEmployeeAction(formData: FormData) {
  await requireDemoRole("admin");
  await assignDemoEmployee(String(formData.get("id") ?? ""), String(formData.get("serviceId") ?? ""));
  revalidatePath("/admin/employees");
  revalidatePath("/scanner");
  revalidatePath("/employee");
}
