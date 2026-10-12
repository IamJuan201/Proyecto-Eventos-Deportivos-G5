"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestEmailChangeAction, updateProfileAction } from "@/features/auth/api/profile.actions";
import { PasswordInput } from "@/shared/components/password-input";
import { useTranslate } from "@/shared/i18n/locale-provider";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className="club-button" type="submit" disabled={pending}>{pending ? t("Un momento…") : t(label)}</button>;
}

/** Name and, for clients, identity document on /profile. */
export function EditProfileForm({ fullName, documentNumber, showDocument }: { fullName: string; documentNumber: string | null; showDocument: boolean }) {
  const t = useTranslate();
  const [state, action] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="auth-reset-form profile-edit-form">
      <label>{t("Nombre completo")}<input className="club-input" name="fullName" defaultValue={fullName} autoComplete="name" minLength={3} maxLength={120} required /></label>
      {showDocument && <label>{t("Número de documento")}
        <input className="club-input" name="documentNumber" defaultValue={documentNumber ?? ""} autoComplete="off" minLength={5} maxLength={30} required={Boolean(documentNumber)} placeholder={t("Cédula o pasaporte")} />
        <small className="field-hint">{t("Lo usamos para identificar tus reservas y pagos.")}</small>
      </label>}
      {state.error && <p className="booking-error" role="alert">{t(state.error)}</p>}
      {state.success && <p className="reset-success" role="status">{t("Tus datos se actualizaron.")}</p>}
      <SaveButton label="Guardar cambios" />
    </form>
  );
}

/** Email change: the new address receives a confirmation link; nothing changes until it is opened. */
export function ChangeEmailForm({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const t = useTranslate();
  const [state, action] = useActionState(requestEmailChangeAction, {});
  if (!hasPassword) return <p className="profile-hint">{t("Tu cuenta entra con Google o GitHub. Crea una contraseña antes de cambiar el correo.")}</p>;
  return (
    <form action={action} className="auth-reset-form profile-email-form" key={state.sentTo ?? "editing"}>
      <label>{t("Nuevo correo")}<input className="club-input" name="email" type="email" autoComplete="email" maxLength={254} placeholder={email} required /></label>
      <label>{t("Contraseña actual")}<PasswordInput className="club-input" name="current" autoComplete="current-password" required /></label>
      {state.error && <p className="booking-error" role="alert">{t(state.error)}</p>}
      {state.sentTo && <p className="reset-success" role="status">{t("Te enviamos un enlace a")} <strong>{state.sentTo}</strong>. {t("Tu correo cambia cuando lo abras; vence en 30 minutos.")}</p>}
      <SaveButton label="Enviar enlace de confirmación" />
    </form>
  );
}
