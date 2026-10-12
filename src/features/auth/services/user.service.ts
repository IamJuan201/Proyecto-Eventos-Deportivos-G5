import "server-only";
import type { Rol, Usuario } from "@/generated/prisma/client";
import { getPrisma, isPrismaError } from "@/shared/lib/prisma";

export type UserRole = "admin" | "empleado" | "cliente";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

type UserRow = Usuario & { rol: Rol };

export const toAppUser = (row: UserRow): AppUser => ({
  id: row.id,
  email: row.correo,
  fullName: row.nombre,
  role: row.rol.nombre as UserRole,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return getPrisma().usuario.findUnique({ where: { correo: normalizeEmail(email) }, include: { rol: true } });
}

/** An employee can sign in only while their Empleado record is active. */
export async function isActiveEmployee(userId: string): Promise<boolean> {
  const count = await getPrisma().empleado.count({ where: { usuarioId: userId, activo: true, eliminadoEn: null } });
  return count > 0;
}

export async function createUser(input: {
  email: string;
  fullName: string;
  passwordHash: string | null;
  role?: UserRole;
  authProvider?: string;
  authId?: string;
}): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  if (!EMAIL.test(email)) throw new Error("Escribe un correo válido.");
  if (fullName.length < 3) throw new Error("Escribe tu nombre completo.");
  try {
    const row = await getPrisma().usuario.create({
      data: {
        correo: email,
        nombre: fullName,
        contrasenaHash: input.passwordHash,
        proveedorAuth: input.authProvider ?? "email",
        // OAuth providers already verified the address.
        correoConfirmado: input.authProvider !== undefined && input.authProvider !== "email",
        authId: input.authId,
        rol: { connect: { nombre: input.role ?? "cliente" } },
      },
      include: { rol: true },
    });
    return toAppUser(row);
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new Error("Ya existe una cuenta con ese correo.");
    throw error;
  }
}
