import "server-only";
import { hashPassword, verifyPassword } from "@/features/auth/lib/password";
import { getPrisma } from "@/shared/lib/prisma";

export interface ProfileView {
  fullName: string;
  email: string;
  role: string;
  provider: string;
  emailConfirmed: boolean;
  hasPassword: boolean;
  serviceName: string | null;
  memberSince: string;
}

export class AccountError extends Error {}

/** Data shown on /profile. */
export async function getProfile(userId: string): Promise<ProfileView | null> {
  const row = await getPrisma().usuario.findUnique({
    where: { id: userId },
    include: { rol: true, empleado: { include: { servicio: { select: { nombre: true } } } } },
  });
  if (!row) return null;
  return {
    fullName: row.nombre,
    email: row.correo,
    role: row.rol.nombre,
    provider: row.proveedorAuth,
    emailConfirmed: row.correoConfirmado,
    hasPassword: Boolean(row.contrasenaHash),
    serviceName: row.empleado?.servicio.nombre ?? null,
    memberSince: row.creadoEn.toISOString(),
  };
}

/**
 * Changes the signed-in user's password. The current one is required when the account has
 * a password; accounts created with Google/GitHub can set their first one. Every older
 * session ends (the session cookie carries a password fingerprint), so the caller must
 * start a fresh session for the current device.
 */
export async function changeOwnPassword(userId: string, current: string, next: string): Promise<void> {
  if (next.length < 8 || next.length > 128) throw new AccountError("La contraseña debe tener entre 8 y 128 caracteres.");
  const prisma = getPrisma();
  const row = await prisma.usuario.findUnique({ where: { id: userId }, select: { contrasenaHash: true } });
  if (!row) throw new AccountError("No encontramos tu cuenta.");
  if (row.contrasenaHash && !(await verifyPassword(current, row.contrasenaHash))) throw new AccountError("La contraseña actual no es correcta.");
  if (row.contrasenaHash && (await verifyPassword(next, row.contrasenaHash))) throw new AccountError("La nueva contraseña debe ser distinta de la actual.");
  await prisma.usuario.update({ where: { id: userId }, data: { contrasenaHash: await hashPassword(next) } });
}
