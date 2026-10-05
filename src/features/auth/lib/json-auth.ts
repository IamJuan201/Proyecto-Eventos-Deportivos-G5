import 'server-only';
import { randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { createJsonUser, getJsonSessionUser, saveJsonSession } from '@/shared/lib/demo-store';
import { redirect } from 'next/navigation';

const scrypt = promisify(scryptCallback);
export const DEMO_SESSION_COOKIE = 'elite_club_demo_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function hashPassword(password: string) {
  const salt = randomUUID();
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function registerJsonAccount(input: { fullName: string; email: string; password: string }) {
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const user = await createJsonUser({ fullName: input.fullName, email: input.email, passwordHash: await hashPassword(input.password) });
  await startJsonSession(user.id);
  return user;
}

export async function startJsonSession(userId: string) {
  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await saveJsonSession({ token, userId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_MAX_AGE });
}

export async function getJsonCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  return token ? getJsonSessionUser(token) : null;
}

export async function requireDemoRole(role: 'admin' | 'empleado' | 'cliente') {
  const user = await getJsonCurrentUser();
  if (user?.role !== role) {
    const path = role === 'admin' ? '/admin/metrics' : role === 'empleado' ? '/employee' : '/my-reservations';
    redirect('/login?next=' + encodeURIComponent(path));
  }
  return user;
}

export async function clearJsonSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (token) {
    const { deleteJsonSession } = await import('@/shared/lib/demo-store');
    await deleteJsonSession(token);
  }
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
