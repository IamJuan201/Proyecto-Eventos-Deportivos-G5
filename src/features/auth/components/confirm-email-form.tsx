"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { confirmEmailChangeAction } from "@/features/auth/api/profile.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

function ConfirmButton() {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className="club-button w-full" type="submit" disabled={pending}>{pending ? t("Un momento…") : t("Confirmar nuevo correo")}</button>;
}

/** Final step of the email change, opened from the link sent to the new address. */
export function ConfirmEmailForm({ token, email }: { token: string; email: string }) {
  const t = useTranslate();
  const [state, action] = useActionState(confirmEmailChangeAction, {});
  if (state.success) {
    return <div className="space-y-4">
      <p className="reset-success" role="status">{t("Listo. Desde ahora tu cuenta usa")} <strong>{email}</strong>.</p>
      <Link className="club-button w-full" href="/profile">{t("Ir a mi perfil")}</Link>
    </div>;
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-slate-300">{t("Vas a usar este correo en tu cuenta:")} <strong className="text-white">{email}</strong></p>
      {state.error && <p className="booking-error" role="alert">{t(state.error)}</p>}
      <ConfirmButton />
    </form>
  );
}
