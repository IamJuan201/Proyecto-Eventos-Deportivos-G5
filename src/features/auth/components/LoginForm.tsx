'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/services');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <label className="flex flex-col">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="border p-2 rounded text-black"
          required
        />
      </label>

      <label className="flex flex-col">
        <span>Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="border p-2 rounded text-black"
          required
        />
      </label>

      {error && (
        <p role="alert" className="text-red-500 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}