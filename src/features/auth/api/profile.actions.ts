"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, startSession } from "@/features/auth/lib/session";
import { AccountError, changeOwnPassword, updateProfile } from "@/features/auth/services/account.service";
import { EmailChangeError, confirmEmailChange, requestEmailChange } from "@/features/auth/services/email-change.service";

export type ChangePasswordState = { error?: string; success?: boolean };
export type ProfileFormState = { error?: string; success?: boolean };
export type EmailChangeState = { error?: string; sentTo?: string };
export type ConfirmEmailState = { error?: string; success?: boolean };

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

export async function updateProfileAction(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesión para continuar." };
  try {
    await updateProfile(user.id, {
      fullName: String(formData.get("fullName") ?? ""),
      documentNumber: formData.has("documentNumber") ? String(formData.get("documentNumber")) : undefined,
    });
  } catch (error) {
    return { error: error instanceof AccountError ? error.message : "No se pudo completar la solicitud." };
  }
  // The name is shown in the header on every page.
  revalidatePath("/", "layout");
  return { success: true };
}

export async function requestEmailChangeAction(_previous: EmailChangeState, formData: FormData): Promise<EmailChangeState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesión para continuar." };
  try {
    const sentTo = await requestEmailChange(user.id, String(formData.get("email") ?? ""), String(formData.get("current") ?? ""));
    return { sentTo };
  } catch (error) {
    return { error: error instanceof EmailChangeError ? error.message : "No se pudo completar la solicitud." };
  }
}

/** Runs from the button on /confirm-email, so mail scanners that open links do not apply the change. */
export async function confirmEmailChangeAction(_previous: ConfirmEmailState, formData: FormData): Promise<ConfirmEmailState> {
  try {
    await confirmEmailChange(String(formData.get("token") ?? ""));
  } catch (error) {
    return { error: error instanceof EmailChangeError ? error.message : "No se pudo completar la solicitud." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
