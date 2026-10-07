import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeEmail } from "@/features/auth/services/user.service";
import { getPrisma, isPrismaError, isUuid } from "@/shared/lib/prisma";

/** Employee as shown in the admin and employee panels. */
export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  serviceId: string;
  serviceName: string;
  serviceActive: boolean;
  isActive: boolean;
  lastActivity: string | null;
}

const withUserAndService = { usuario: true, servicio: true } satisfies Prisma.EmpleadoInclude;
type EmpleadoRow = Prisma.EmpleadoGetPayload<{ include: typeof withUserAndService }>;

const toStaffMember = (row: EmpleadoRow): StaffMember => ({
  id: row.id,
  userId: row.usuarioId,
  name: row.usuario.nombre,
  email: row.usuario.correo,
  serviceId: row.servicioId,
  serviceName: row.servicio.nombre,
  serviceActive: row.servicio.activo,
  isActive: row.activo,
  lastActivity: row.ultimaActividad?.toISOString() ?? null,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVICE_TAKEN = "Ese espacio ya tiene un empleado activo. Desactívalo o reasígnalo primero.";

/** Index Empleado_servicio_id_activo_key: one active employee per service. */
async function ensureServiceAvailable(tx: Prisma.TransactionClient, serviceId: string, exceptEmployeeId?: string) {
  if (!isUuid(serviceId) || !(await tx.servicio.count({ where: { id: serviceId, activo: true } }))) throw new Error("Selecciona un espacio activo.");
  const taken = await tx.empleado.count({ where: { servicioId: serviceId, activo: true, eliminadoEn: null, id: exceptEmployeeId ? { not: exceptEmployeeId } : undefined } });
  if (taken) throw new Error(SERVICE_TAKEN);
}

const rethrowTaken = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) throw new Error(SERVICE_TAKEN);
  throw error;
};

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await getPrisma().empleado.findMany({ where: { eliminadoEn: null }, include: withUserAndService, orderBy: { usuario: { nombre: "asc" } } });
  return rows.map(toStaffMember);
}

/** The active employee record of a signed-in user, or null. */
export async function getActiveStaffByUser(userId: string): Promise<StaffMember | null> {
  const row = await getPrisma().empleado.findFirst({ where: { usuarioId: userId, activo: true, eliminadoEn: null }, include: withUserAndService });
  return row && toStaffMember(row);
}

export async function createStaffAccount(input: { name: string; email: string; serviceId: string; passwordHash: string }) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (name.length < 3 || !EMAIL.test(email)) throw new Error("Escribe un nombre y un correo válidos.");
  await getPrisma().$transaction(async (tx) => {
    if (await tx.usuario.count({ where: { correo: email } })) throw new Error("Ya existe una cuenta con ese correo.");
    await ensureServiceAvailable(tx, input.serviceId);
    await tx.empleado.create({
      data: {
        servicio: { connect: { id: input.serviceId } },
        usuario: { create: { nombre: name, correo: email, contrasenaHash: input.passwordHash, correoConfirmado: true, rol: { connect: { nombre: "empleado" } } } },
      },
    });
  }).catch(rethrowTaken);
}

export async function assignStaff(id: string, serviceId: string) {
  await getPrisma().$transaction(async (tx) => {
    const employee = isUuid(id) ? await tx.empleado.findUnique({ where: { id } }) : null;
    if (!employee) throw new Error("No encontramos este empleado.");
    if (employee.activo) await ensureServiceAvailable(tx, serviceId, id);
    else if (!isUuid(serviceId) || !(await tx.servicio.count({ where: { id: serviceId, activo: true } }))) throw new Error("Selecciona un espacio activo.");
    await tx.empleado.update({ where: { id }, data: { servicioId: serviceId } });
  }).catch(rethrowTaken);
}

export async function setStaffActive(id: string, isActive: boolean) {
  await getPrisma().$transaction(async (tx) => {
    const employee = isUuid(id) ? await tx.empleado.findUnique({ where: { id } }) : null;
    if (!employee) throw new Error("No encontramos este empleado.");
    if (isActive) await ensureServiceAvailable(tx, employee.servicioId, id);
    await tx.empleado.update({ where: { id }, data: { activo: isActive } });
  }).catch(rethrowTaken);
}
