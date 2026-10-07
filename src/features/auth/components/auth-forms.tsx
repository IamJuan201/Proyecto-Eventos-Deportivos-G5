'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { authService, safeNextPath } from '@/features/auth/services/auth.service';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';

interface LoginFormProps {
  nextPath?: string;
  oauthError?: boolean;
}

function OAuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wider">
        <span className="bg-slate-900/90 px-3 text-slate-400 backdrop-blur-md rounded-full border border-white/5 py-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}

export function LoginForm({ nextPath = '/', oauthError = false }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState(
    oauthError ? 'No se pudo completar el acceso con el proveedor. Inténtalo de nuevo.' : ''
  );
  const [pending, startTransition] = useTransition();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get('identifier') || form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    if (!identifier || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      const user = await authService.login({ email: identifier, password });
      const roleHome =
        user.role === 'admin' ? '/admin/metrics' : user.role === 'empleado' ? '/employee' : '/';
      const destination = safeNextPath(nextPath) === '/' ? roleHome : safeNextPath(nextPath);
      startTransition(() => {
        router.replace(destination);
        router.refresh();
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.');
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Proveedores externos (Google y GitHub) arriba */}
      <OAuthButtons nextPath={safeNextPath(nextPath)} />

      {/* 2. Divisor central con la palabra "or" */}
      <OAuthDivider label="or" />

      {/* 3. Formulario tradicional: Email o Username y Password */}
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email o Username
          </label>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="ejemplo@correo.com o usuario"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-slate-200 hover:text-sky-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-800/60 bg-rose-950/50 p-3 text-xs text-rose-300 backdrop-blur-md"
          >
            {error}
          </p>
        )}

        <button
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:from-sky-400 hover:to-sky-500 hover:shadow-sky-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          type="submit"
          disabled={pending}
        >
          <span>{pending ? 'Ingresando…' : 'Iniciar sesión'}</span>
        </button>
      </form>
    </div>
  );
}

export function RegisterForm({ nextPath = '/' }: { nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));

    if (password !== String(form.get('confirm-password'))) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const user = await authService.register(
        {
          fullName: String(form.get('name')),
          email: String(form.get('email')),
          password,
        },
        nextPath
      );

      if (user.emailConfirmationRequired) {
        setMessage('Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
        return;
      }

      startTransition(() => {
        router.replace(safeNextPath(nextPath));
        router.refresh();
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.');
    }
  }

  return (
    <div className="space-y-5">
      <OAuthButtons nextPath={safeNextPath(nextPath)} />

      <OAuthDivider label="or" />

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Nombre completo
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
            name="name"
            autoComplete="name"
            required
            minLength={3}
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Correo electrónico
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Contraseña
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Confirmar contraseña
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner backdrop-blur-md outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-950/80 focus:ring-2 focus:ring-sky-400/20"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <label className="flex items-start gap-2.5 text-xs text-slate-400 pt-1">
          <input className="mt-0.5 accent-sky-400 rounded" type="checkbox" required />
          <span>Acepto los términos del servicio y la política de privacidad.</span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-800/60 bg-rose-950/50 p-3 text-xs text-rose-300 backdrop-blur-md"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-xl border border-sky-800/60 bg-sky-950/50 p-3 text-xs text-sky-300 backdrop-blur-md"
          >
            {message}{' '}
            <Link className="underline font-semibold ml-1 text-sky-200 hover:text-sky-400" href="/login">
              Ir a iniciar sesión
            </Link>
          </p>
        )}

        <button
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:from-sky-400 hover:to-sky-500 hover:shadow-sky-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          type="submit"
          disabled={pending}
        >
          <span>{pending ? 'Creando cuenta…' : 'Crear cuenta'}</span>
        </button>
      </form>
    </div>
  );
}
