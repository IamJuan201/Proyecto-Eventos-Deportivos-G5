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

  async register(data: RegisterData): Promise<AuthUser> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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