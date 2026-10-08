"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword } from "@/features/auth/lib/password";
import { requireRole } from "@/features/auth/lib/session";
import { assignStaff, createStaffAccount, setStaffActive, setStaffPassword } from "@/features/employees/services/staff.service";

const EMPLOYEES_PATH = "/admin/employees";

async function run(work: () => Promise<void>, fallback: string) {
  try {
    await work();
  } catch (error) {
    redirect(EMPLOYEES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : fallback));
  }
  revalidatePath(EMPLOYEES_PATH);
  revalidatePath("/employee");
  revalidatePath("/scanner");
  redirect(EMPLOYEES_PATH);
}

export async function createEmployeeAction(formData: FormData) {
  await requireRole("admin");
  await run(async () => {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) throw new Error("La contraseña inicial debe tener al menos 8 caracteres.");
    await createStaffAccount({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      passwordHash: await hashPassword(password),
    });
  }, "No se pudo guardar el empleado.");
}

export async function changeEmployeePasswordAction(formData: FormData) {
  await requireRole("admin");
  await run(async () => {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8 || password.length > 128) throw new Error("La nueva contraseña debe tener entre 8 y 128 caracteres.");
    await setStaffPassword(String(formData.get("id") ?? ""), await hashPassword(password));
  }, "No se pudo cambiar la contraseña del empleado.");
}

export async function toggleEmployeeAction(formData: FormData) {
  await requireRole("admin");
  await run(() => setStaffActive(String(formData.get("id") ?? ""), formData.get("isActive") === "true"), "No se pudo cambiar el estado del empleado.");
}

export async function assignEmployeeAction(formData: FormData) {
  await requireRole("admin");
  await run(() => assignStaff(String(formData.get("id") ?? ""), String(formData.get("serviceId") ?? "")), "No se pudo reasignar el empleado.");
}
