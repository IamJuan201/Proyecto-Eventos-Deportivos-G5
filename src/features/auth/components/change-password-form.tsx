"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/features/auth/api/profile.actions";
import { PasswordInput } from "@/shared/components/password-input";
import { useTranslate } from "@/shared/i18n/locale-provider";

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className="club-button" type="submit" disabled={pending}>{pending ? t("Un momento…") : t("Guardar contraseña")}</button>;
}

/** Password change on /profile. Accounts without a password (Google/GitHub) can set their first one. */
export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslate();
  const [state, action] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="auth-reset-form profile-password-form" key={state.success ? "saved" : "editing"}>
      {hasPassword && <label>{t("Contraseña actual")}<PasswordInput className="club-input" name="current" autoComplete="current-password" required /></label>}
      <label>{t("Nueva contraseña")}<PasswordInput className="club-input" name="password" autoComplete="new-password" minLength={8} maxLength={128} placeholder={t("Mínimo 8 caracteres")} required /></label>
      <label>{t("Confirmar contraseña")}<PasswordInput className="club-input" name="confirm" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      {state.error && <p className="booking-error" role="alert">{t(state.error)}</p>}
      {state.success && <p className="reset-success" role="status">{t("Tu contraseña se actualizó. Cerramos tus otras sesiones abiertas.")}</p>}
      <SaveButton />
    </form>
  );
}
