import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role?: "admin" | "empleado" | "cliente";
  emailConfirmationRequired?: boolean;
};

type ErrorResponse = {
  message?: string;
};

async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const body: ErrorResponse = await response.json();

    if (body.message) {
      return body.message;
    }

    return defaultMessage;
  } catch {
    return defaultMessage;
  }
}

export const authService = {
  async loginWithOAuth(provider: "google" | "github", nextPath = "/"): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const callback = new URL("/api/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeNextPath(nextPath));
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    });
    if (error) throw new Error(error.message);
  },

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, 'No se pudo iniciar sesión');
      throw new Error(message);
    }

    const user: AuthUser = await response.json();
    return user;
  },

  async register(data: RegisterData, nextPath = "/"): Promise<AuthUser> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, nextPath: safeNextPath(nextPath) }),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, 'No se pudo crear la cuenta');
      throw new Error(message);
    }

    const user: AuthUser = await response.json();
    return user;
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, 'No se pudo cerrar la sesión');
      throw new Error(message);
    }
  },
};

export function safeNextPath(value: string | null | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
