import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export type LoginCredentials = {
  email: string;
  password: string;
  turnstileToken?: string;
};

export type RegisterData = {
  fullName: string;
  email: string;
  password: string;
  turnstileToken?: string;
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
  emailConfirmationRequired?: boolean;
  email?: string;
  retryAfterSeconds?: number;
};

/**
 * Action error carrying the verification redirect data.
 */
export class AuthError extends Error {
  /**
   * True when the client must show the OTP verify page.
   */
  emailConfirmationRequired?: boolean;
  /**
   * Account email for the verify page.
   */
  email?: string;
  /**
   * Seconds to wait before resending a code (429 responses).
   */
  retryAfterSeconds?: number;

  /**
   * Creates an action error from an API error body.
   *
   * @param body Parsed error payload.
   * @param fallback Default message when the body has none.
   */
  constructor(body: ErrorResponse, fallback: string) {
    super(body.message ?? fallback);
    this.name = "AuthError";
    this.emailConfirmationRequired = body.emailConfirmationRequired;
    this.email = body.email;
    this.retryAfterSeconds = body.retryAfterSeconds;
  }
}

/**
 * Parses a failed auth response into an AuthError.
 *
 * @param response Failed fetch response.
 * @param fallback Default message when the body has none.
 * @returns Auth error with redirect and retry data.
 */
async function toAuthError(response: Response, fallback: string): Promise<AuthError> {
  try {
    const body: ErrorResponse = await response.json();
    return new AuthError(body, fallback);
  } catch {
    return new AuthError({}, fallback);
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
      throw await toAuthError(response, 'No se pudo iniciar sesión');
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
      throw await toAuthError(response, 'No se pudo crear la cuenta');
    }

    const user: AuthUser = await response.json();
    return user;
  },

  /**
   * Confirms an email with an 8-digit OTP and signs the user in.
   *
   * @param email Account email address.
   * @param code Code typed by the user.
   * @returns Signed-in user.
   */
  async verifyOtp(email: string, code: string): Promise<AuthUser> {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      throw await toAuthError(response, 'No se pudo verificar el código');
    }

    const user: AuthUser = await response.json();
    return user;
  },

  /**
   * Requests a new OTP honoring the server cooldown.
   *
   * @param email Account email address.
   * @param reason Page copy used in the email link.
   */
  async resendOtp(email: string, reason: 'register' | 'login' = 'register'): Promise<void> {
    const response = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason }),
    });

    if (!response.ok) {
      throw await toAuthError(response, 'No se pudo enviar el código');
    }
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      throw await toAuthError(response, 'No se pudo cerrar la sesión');
    }
  },
};

export function safeNextPath(value: string | null | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
