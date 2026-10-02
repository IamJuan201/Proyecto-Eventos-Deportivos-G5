import React from "react";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-sport-bg">
      {/* Panel izquierdo - branding deportivo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sport-surface relative overflow-hidden px-12">
        <div className="absolute inset-0 bg-gradient-to-br from-sport-emerald/10 to-transparent" />
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-sport-emerald/20 border-2 border-sport-emerald flex items-center justify-center mx-auto">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-4xl font-black text-sport-text leading-tight">
            Únete a la
            <br />
            <span className="text-sport-emerald">Competencia</span>
          </h1>
          <p className="text-sport-muted text-lg max-w-xs">
            Crea tu cuenta y empieza a participar en los mejores eventos
            deportivos.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-sport-border" />
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Encabezado */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-sport-text">
              Crea tu cuenta
            </h2>
            <p className="mt-2 text-sm text-sport-muted">
              ¿Ya tienes una cuenta?{" "}
              <a
                href="#"
                className="font-medium text-sport-emerald hover:text-sport-emerald-hover transition-colors"
              >
                Inicia sesión aquí
              </a>
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" action="#" method="POST">
            <div className="space-y-4">
              {/* Nombre Completo */}
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-sm font-medium text-sport-text mb-1"
                >
                  Nombre completo
                </label>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-3 text-sport-text placeholder-sport-muted focus:border-sport-emerald focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow sm:text-sm transition-colors"
                  placeholder="Juan Pérez"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-sport-text mb-1"
                >
                  Correo electrónico
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-3 text-sport-text placeholder-sport-muted focus:border-sport-emerald focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow sm:text-sm transition-colors"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-sport-text mb-1"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-3 text-sport-text placeholder-sport-muted focus:border-sport-emerald focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-sport-text mb-1"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-3 text-sport-text placeholder-sport-muted focus:border-sport-emerald focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-sport-border bg-sport-surface-2 accent-sport-emerald focus:ring-sport-emerald-glow"
              />
              <label htmlFor="terms" className="text-sm text-sport-muted">
                Acepto los{" "}
                <a
                  href="#"
                  className="font-medium text-sport-emerald hover:text-sport-emerald-hover transition-colors"
                >
                  Términos de servicio
                </a>{" "}
                y la{" "}
                <a
                  href="#"
                  className="font-medium text-sport-emerald hover:text-sport-emerald-hover transition-colors"
                >
                  Política de privacidad
                </a>
              </label>
            </div>

            {/* Botón Principal */}
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-sport-emerald px-4 py-3 text-sm font-semibold text-sport-bg hover:bg-sport-emerald-hover focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow focus:ring-offset-2 focus:ring-offset-sport-bg transition-colors shadow-lg"
            >
              Registrarse
            </button>
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sport-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-sport-bg px-3 text-sport-muted">
                O registrarse con
              </span>
            </div>
          </div>

          {/* Botones de Redes Sociales */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
            >
              <span>Google</span>
            </button>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg border border-sport-border bg-sport-surface-2 px-4 py-2.5 text-sm font-medium text-sport-text hover:bg-sport-surface hover:border-sport-emerald transition-colors shadow-sm"
            >
              <span>GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
