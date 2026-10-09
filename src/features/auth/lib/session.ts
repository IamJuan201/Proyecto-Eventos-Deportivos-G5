import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword } from "@/features/auth/lib/password";
import { createUser, findActiveUserById, type AppUser, type UserRole } from "@/features/auth/services/user.service";

/**
 * Signed cookie session: `<base64url payload>.<HMAC-SHA256>`, no session table.
 * Bridge until Supabase Auth (Usuario.auth_id) replaces it; the user is re-read from
 * PostgreSQL on every request, so deactivations and role changes apply immediately.
 */
export const SESSION_COOKIE = "elite_club_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

type SessionPayload = { uid: string; exp: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET no está configurada (mínimo 32 caracteres).");
  return value;
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function encode(payload: SessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(token: string): SessionPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return typeof payload.uid === "string" && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

/** Only callable from Route Handlers and Server Functions (sets a cookie). */
export async function startSession(userId: string) {
  const token = encode({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Deduplicated per request: header, layout and page share one query. */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = token ? decode(token) : null;
  return payload ? findActiveUserById(payload.uid) : null;
});

export async function requireRole(role: UserRole): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user?.role !== role) {
    const path = role === "admin" ? "/admin/metrics" : role === "empleado" ? "/employee" : "/my-reservations";
    redirect("/login?next=" + encodeURIComponent(path));
  }
  return user;
}

export async function registerAccount(input: { fullName: string; email: string; password: string }) {
  if (input.password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  return createUser({ fullName: input.fullName, email: input.email, passwordHash: await hashPassword(input.password) });
}
