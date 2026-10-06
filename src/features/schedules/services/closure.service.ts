import "server-only";
import type { TipoCierre } from "@/generated/prisma/client";
import { bogotaDate, bogotaDayEnd, bogotaDayStart, toDbDate } from "@/shared/lib/bogota-time";
import { getPrisma, isUuid } from "@/shared/lib/prisma";

export const closureTypes = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "festivo", label: "Festivo" },
  { value: "evento_privado", label: "Evento privado" },
] as const satisfies readonly { value: TipoCierre; label: string }[];

export interface Closure {
  id: string;
  /** null = the whole complex. */
  serviceId: string | null;
  serviceName: string | null;
  from: string;
  to: string;
  reason: string;
  type: TipoCierre;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function listActiveClosures(): Promise<Closure[]> {
  const rows = await getPrisma().cierreServicio.findMany({ where: { activo: true }, include: { servicio: true }, orderBy: { fechaInicio: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    serviceId: row.servicioId,
    serviceName: row.servicio?.nombre ?? null,
    from: bogotaDate(row.fechaInicio),
    to: bogotaDate(row.fechaFin),
    reason: row.motivo,
    type: row.tipo,
  }));
}

/** True when an active closure of the service or of the whole complex touches that Bogota day. */
export async function isClosedOn(serviceId: string, date: string): Promise<boolean> {
  const count = await getPrisma().cierreServicio.count({
    where: {
      activo: true,
      OR: [{ servicioId: serviceId }, { servicioId: null }],
      fechaInicio: { lte: bogotaDayEnd(date) },
      fechaFin: { gte: bogotaDayStart(date) },
    },
  });
  return count > 0;
}

export async function createClosure(input: { serviceId: string; from: string; to: string; reason: string; type: string; createdBy: string }) {
  const serviceId = input.serviceId === "*" ? null : input.serviceId;
  const prisma = getPrisma();
  if (serviceId !== null && (!isUuid(serviceId) || !(await prisma.servicio.count({ where: { id: serviceId } })))) throw new Error("Selecciona un servicio válido.");
  if (!DATE.test(input.from) || !DATE.test(input.to) || input.from > input.to) throw new Error("Revisa el rango de fechas del cierre.");
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 240) throw new Error("Escribe el motivo del cierre (entre 3 y 240 caracteres).");
  const type = closureTypes.find((item) => item.value === input.type)?.value;
  if (!type) throw new Error("Selecciona el tipo de cierre.");
  const paidBooking = await prisma.reserva.count({
    where: { estado: "pagada", fecha: { gte: toDbDate(input.from), lte: toDbDate(input.to) }, ...(serviceId ? { servicioId: serviceId } : {}) },
  });
  if (paidBooking) throw new Error("El rango incluye una reserva pagada. No se puede cerrar un horario confirmado.");
  await prisma.cierreServicio.create({
    data: { servicioId: serviceId, fechaInicio: bogotaDayStart(input.from), fechaFin: bogotaDayEnd(input.to), motivo: reason, tipo: type, creadoPor: input.createdBy },
  });
}

/** Closures are deactivated, not deleted, to keep who created them and why. */
export async function deactivateClosure(id: string) {
  if (!isUuid(id)) throw new Error("No encontramos ese cierre.");
  const { count } = await getPrisma().cierreServicio.updateMany({ where: { id, activo: true }, data: { activo: false } });
  if (!count) throw new Error("No encontramos ese cierre.");
}
