"use server";

import { getCurrentUser, startSession } from "@/features/auth/lib/session";
import { AccountError, changeOwnPassword } from "@/features/auth/services/account.service";

export type ChangePasswordState = { error?: string; success?: boolean };

export async function changePasswordAction(_previous: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesión para continuar." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (next !== String(formData.get("confirm") ?? "")) return { error: "Las contraseñas no coinciden." };
  try {
    await changeOwnPassword(user.id, current, next);
  } catch (error) {
    return { error: error instanceof AccountError ? error.message : "No se pudo completar la solicitud." };
  }
  // The password change ended every older session; keep this device signed in.
  await startSession(user.id);
  return { success: true };
}
