"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export function PasswordResetForm({ mode }: { mode: "request" | "update" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (mode === "request") {
          const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
          if (authError) throw authError;
          setMessage("Si la dirección está registrada, recibirás un enlace para restablecer tu contraseña.");
        } else {
          if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
          const { error: authError } = await supabase.auth.updateUser({ password });
          if (authError) throw authError;
          setMessage("Tu contraseña se actualizó. Ya puedes iniciar sesión.");
          window.setTimeout(() => router.push("/login"), 1000);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo completar la solicitud.");
      }
    });
  }

  return (
    <form className="auth-reset-form" onSubmit={submit}>
      {mode === "request" ? <label>Correo electrónico<input className="club-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" required /></label> : <label>Nueva contraseña<input className="club-input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" required /></label>}
      {error && <p className="booking-error" role="alert">{error}</p>}
      {message && <p className="reset-success" role="status">{message}</p>}
      <button className="club-button" type="submit" disabled={pending}>{pending ? "Un momento…" : mode === "request" ? "Enviar instrucciones" : "Guardar contraseña"}</button>
    </form>
  );
}
