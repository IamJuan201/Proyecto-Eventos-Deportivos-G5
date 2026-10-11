"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { useTranslate } from "@/shared/i18n/locale-provider";

export function PasswordResetForm({ mode }: { mode: "request" | "update" }) {
  const t = useTranslate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (mode === "request") {
          const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/reset-password",
          });
          if (authError) throw authError;
          setMessage(
            t("Si la dirección está registrada, recibirás un enlace para restablecer tu contraseña.")
          );
        } else {
          if (password.length < 8)
            throw new Error(t("La contraseña debe tener al menos 8 caracteres."));
          const { error: authError } = await supabase.auth.updateUser({ password });
          if (authError) throw authError;
          setMessage(t("Tu contraseña se actualizó. Ya puedes iniciar sesión."));
          window.setTimeout(() => router.push("/login"), 1200);
        }
      } catch (caught) {
        setError(
          caught instanceof Error ? t(caught.message) : t("No se pudo completar la solicitud.")
        );
      }
    });
  }

  return (
    <form className="auth-reset-form-container space-y-5" onSubmit={submit}>
      {mode === "request" ? (
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase">
            {t("Correo electrónico")}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              className="club-input pl-11 text-sm bg-slate-900/80 border-slate-700/80 focus:border-sky-500 rounded-xl transition-all"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {t("Te enviaremos un correo con el enlace seguro para reestablecer tu clave.")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-slate-300 uppercase">
            {t("Nueva contraseña")}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              className="club-input pl-11 pr-11 text-sm bg-slate-900/80 border-slate-700/80 focus:border-sky-500 rounded-xl transition-all"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("Mínimo 8 caracteres")}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t("Ocultar contraseña") : t("Mostrar contraseña")}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
            <span className={`inline-block w-2 h-2 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-slate-600"}`} />
            <span>{t("Al menos 8 caracteres")}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-start gap-2.5 animate-fadeIn" role="alert">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 flex items-start gap-2.5 animate-fadeIn" role="status">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      <button
        className="club-button w-full shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all text-sm font-bold min-h-[46px] rounded-xl cursor-pointer"
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {t("Un momento…")}
          </span>
        ) : mode === "request" ? (
          t("Enviar instrucciones")
        ) : (
          t("Guardar contraseña")
        )}
      </button>
    </form>
  );
}
