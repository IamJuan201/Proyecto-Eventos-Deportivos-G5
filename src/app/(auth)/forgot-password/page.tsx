import React from "react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen bg-sport-bg">
      {/* Panel izquierdo - branding deportivo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sport-surface relative overflow-hidden px-12">
        <div className="absolute inset-0 bg-gradient-to-br from-sport-emerald/10 to-transparent" />
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-sport-emerald/20 border-2 border-sport-emerald flex items-center justify-center mx-auto">
            <span className="text-4xl">🔑</span>
          </div>
          <h1 className="text-4xl font-black text-sport-text leading-tight">
            Recupera tu
            <br />
            <span className="text-sport-emerald">Acceso</span>
          </h1>
          <p className="text-sport-muted text-lg max-w-xs">
            Te enviaremos un enlace a tu correo para que puedas restablecer tu
            contraseña.
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
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="mt-2 text-sm text-sport-muted">
              Ingresa tu correo y te enviaremos las instrucciones.
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" action="#" method="POST">
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

            {/* Botón Principal */}
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-sport-emerald px-4 py-3 text-sm font-semibold text-sport-bg hover:bg-sport-emerald-hover focus:outline-none focus:ring-2 focus:ring-sport-emerald-glow focus:ring-offset-2 focus:ring-offset-sport-bg transition-colors shadow-lg"
            >
              Enviar enlace de recuperación
            </button>

            {/* Volver al login */}
            <div className="text-center">
              <a
                href="/login"
                className="text-sm font-medium text-sport-muted hover:text-sport-emerald transition-colors"
              >
                ← Volver a iniciar sesión
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
