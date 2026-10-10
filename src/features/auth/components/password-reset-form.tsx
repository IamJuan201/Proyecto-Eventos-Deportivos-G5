"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import { useTranslate } from "@/shared/i18n/locale-provider";
import { PasswordInput } from "@/shared/components/password-input";
import { TurnstileWidget, getTurnstileSiteKey, isTurnstileWidgetEnabled } from "@/features/auth/components/turnstile-widget";

/** Request mode emails a reset link; update mode sets the new password from that link's token. */
export function PasswordResetForm({ mode, token = "" }: { mode: "request" | "update"; token?: string }) {
  const t = useTranslate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState("");
  const captchaEnabled = mode === "request" && isTurnstileWidgetEnabled();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        if (mode === "request") {
          if (captchaEnabled && !turnstileToken) throw new Error(t("Completa la verificación de seguridad."));
          await authService.requestPasswordReset(email, turnstileToken || undefined);
          setMessage(t("Si la dirección está registrada, recibirás un enlace para restablecer tu contraseña."));
        } else {
          if (password.length < 8) throw new Error(t("La contraseña debe tener al menos 8 caracteres."));
          if (password !== confirm) throw new Error(t("Las contraseñas no coinciden."));
          await authService.resetPassword(token, password);
          setMessage(t("Tu contraseña se actualizó. Ya puedes iniciar sesión."));
          window.setTimeout(() => router.push("/login"), 1200);
        }
      } catch (caught) {
        setError(caught instanceof Error ? t(caught.message) : t("No se pudo completar la solicitud."));
      }
    });
  }

  return (
    <form className="auth-reset-form" onSubmit={submit}>
      {mode === "request"
        ? <label>{t("Correo electrónico")}<input className="club-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" required /></label>
        : <>
          <label>{t("Nueva contraseña")}<PasswordInput className="club-input" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("Mínimo 8 caracteres")} required /></label>
          <label>{t("Confirmar contraseña")}<PasswordInput className="club-input" autoComplete="new-password" minLength={8} maxLength={128} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
        </>}
      {captchaEnabled && <TurnstileWidget siteKey={getTurnstileSiteKey()} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />}
      {error && <p className="booking-error" role="alert">{error}</p>}
      {message && <p className="reset-success" role="status">{message}</p>}
      <button className="club-button" type="submit" disabled={pending}>{pending ? t("Un momento…") : mode === "request" ? t("Enviar instrucciones") : t("Guardar contraseña")}</button>
    </form>
  );
}
