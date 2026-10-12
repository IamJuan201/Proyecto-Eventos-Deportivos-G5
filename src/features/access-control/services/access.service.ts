import "server-only";
import type { ResultadoAcceso } from "@/generated/prisma/client";
import type { StaffMember } from "@/features/employees/services/staff.service";
import { bogotaDate, bogotaDayStart, bogotaTime, fromDbDate, fromDbTime } from "@/shared/lib/bogota-time";
import { getPrisma } from "@/shared/lib/prisma";

export type AccessResult = ResultadoAcceso;

export interface AccessStats {
  total: number;
  today: number;
  allowedToday: number;
  rejectedToday: number;
  recent: { id: string; result: AccessResult; code: string; createdAt: string }[];
}

/** Pools apply the minor-under-one-meter rule. */
export async function isPoolService(serviceId: string): Promise<boolean> {
  const service = await getPrisma().servicio.findUnique({ where: { id: serviceId }, include: { categoria: true } });
  return !!service && [service.nombre, service.categoria.nombre].some((name) => name.toLowerCase().includes("piscina"));
}

const mask = (code: string) => (code.length > 4 ? "••••" + code.slice(-4) : code);

export async function scanQr(rawCode: string, staff: StaffMember, minorUnderOneMeter: boolean): Promise<{ result: AccessResult; message: string }> {
  const prisma = getPrisma();
  const code = rawCode.trim().toUpperCase();
  const qr = await prisma.codigoQR.findUnique({ where: { codigo: code }, include: { reserva: { include: { servicio: true } } } });
  const now = new Date();
  let result: AccessResult = "permitido";
  let message = "Acceso autorizado. Entrega la manilla al visitante.";

  if (!qr) {
    result = "qr_invalido"; message = "No encontramos un código QR válido.";
  } else if (!staff.serviceActive) {
    result = "servicio_incorrecto"; message = "Tu cuenta no tiene un espacio activo asignado. Contacta al administrador.";
  } else if (qr.reserva.servicioId !== staff.serviceId) {
    result = "servicio_incorrecto"; message = `Este QR corresponde a ${qr.reserva.servicio.nombre}. Tu espacio asignado es ${staff.serviceName}. El QR no fue consumido.`;
  } else if (qr.reserva.estado !== "pagada") {
    result = "reserva_no_pagada"; message = "La reserva no tiene un pago aprobado.";
  } else {
    const date = fromDbDate(qr.reserva.fecha);
    const start = fromDbTime(qr.reserva.horaInicio);
    const end = fromDbTime(qr.reserva.horaFin);
    const time = bogotaTime(now);
    if (date !== bogotaDate(now) || time < start || time >= end) {
      result = "fuera_de_horario"; message = "Válido el " + date + ", de " + start + " a " + end + ".";
    } else if (qr.usado) {
      result = "qr_usado"; message = "Este código ya fue registrado.";
    } else if (minorUnderOneMeter && (await isPoolService(staff.serviceId))) {
      result = "rechazado_menor"; message = "Acceso rechazado. El menor mide menos de 1 metro.";
    }
  }

  await prisma.$transaction(async (tx) => {
    if (qr && result === "permitido") {
      // Conditional update: two simultaneous reads cannot both consume the QR.
      const { count } = await tx.codigoQR.updateMany({ where: { id: qr.id, usado: false }, data: { usado: true, fechaUso: now } });
      if (!count) { result = "qr_usado"; message = "Este código ya fue registrado."; }
      else await tx.empleado.update({ where: { id: staff.id }, data: { ultimaActividad: now } });
    }
    await tx.registroAcceso.create({
      data: { qrId: qr?.id ?? null, empleadoId: staff.id, servicioId: staff.serviceId, resultado: result, fechaHora: now, codigoLeido: mask(code) },
    });
  });
  return { result, message };
}

export async function getAccessStats(employeeId: string): Promise<AccessStats> {
  const prisma = getPrisma();
  const todayStart = bogotaDayStart(bogotaDate());
  const [total, today, allowedToday, recent] = await Promise.all([
    prisma.registroAcceso.count({ where: { empleadoId: employeeId } }),
    prisma.registroAcceso.count({ where: { empleadoId: employeeId, fechaHora: { gte: todayStart } } }),
    prisma.registroAcceso.count({ where: { empleadoId: employeeId, fechaHora: { gte: todayStart }, resultado: "permitido" } }),
    prisma.registroAcceso.findMany({ where: { empleadoId: employeeId }, orderBy: { fechaHora: "desc" }, take: 5 }),
  ]);
  return {
    total,
    today,
    allowedToday,
    rejectedToday: today - allowedToday,
    recent: recent.map((log) => ({ id: log.id, result: log.resultado, code: log.codigoLeido ?? "", createdAt: log.fechaHora.toISOString() })),
  };
}
