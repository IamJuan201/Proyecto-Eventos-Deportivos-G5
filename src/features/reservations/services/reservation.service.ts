import "server-only";
import { randomUUID } from "node:crypto";
import type { EstadoReserva, Prisma } from "@/generated/prisma/client";
import { isClosedOn } from "@/features/schedules/services/closure.service";
import { serviceService } from "@/features/services/services/service.service";
import type { Service } from "@/features/services/types/service.types";
import { bogotaHour, dayOfWeek, fromDbDate, fromDbTime, reservationDateBounds, toDbDate, toDbTime } from "@/shared/lib/bogota-time";
import { getPrisma, isPrismaError, isUuid } from "@/shared/lib/prisma";

/** Version of the booking terms the client accepts (TerminosAceptados.version_terminos). */
export const TERMS_VERSION = "2026-10-01";
const PAYMENT_WINDOW_MS = 10 * 60_000;
/** One-hour slots from 08:00 to 16:00 (the complex closes at 17:00). */
const SLOT_HOURS = Array.from({ length: 9 }, (_, index) => 8 + index);
const MONDAY = 1;

export interface ReservationView {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
  people: number;
  status: EstadoReserva;
  subtotal: number;
  discount: number;
  total: number;
  paymentExpiresAt: string | null;
  payment: { reference: string; paidAt: string } | null;
  qrs: { id: string; code: string }[];
}

const viewInclude = {
  servicio: true,
  cliente: true,
  pagos: { where: { estado: "aprobado" }, orderBy: { fechaPago: "desc" }, take: 1 },
  codigosQr: { orderBy: { codigo: "asc" } },
} satisfies Prisma.ReservaInclude;

const toView = (row: Prisma.ReservaGetPayload<{ include: typeof viewInclude }>): ReservationView => ({
  id: row.id,
  serviceId: row.servicioId,
  serviceName: row.servicio.nombre,
  customerName: row.cliente.nombre,
  customerEmail: row.cliente.correo,
  date: fromDbDate(row.fecha),
  startTime: fromDbTime(row.horaInicio),
  endTime: fromDbTime(row.horaFin),
  quantity: row.cantidadCupos,
  people: row.cantidadPersonas,
  status: row.estado,
  subtotal: Number(row.subtotal),
  discount: Number(row.descuento),
  total: Number(row.total),
  paymentExpiresAt: row.bloqueoExpiraEn?.toISOString() ?? null,
  payment: row.pagos[0]?.fechaPago ? { reference: row.pagos[0].referencia, paidAt: row.pagos[0].fechaPago.toISOString() } : null,
  qrs: row.codigosQr.map((qr) => ({ id: qr.id, code: qr.codigo })),
});

const hourText = (hour: number) => String(hour).padStart(2, "0") + ":00";

/** Paid bookings and unpaid ones still inside their 10-minute hold take capacity. */
const blocking = (now: Date): Prisma.ReservaWhereInput => ({
  OR: [{ estado: "pagada" }, { estado: "pendiente_pago", bloqueoExpiraEn: { gt: now } }],
});

const overlapping = (start: string, end: string): Prisma.ReservaWhereInput => ({
  horaInicio: { lt: toDbTime(end) },
  horaFin: { gt: toDbTime(start) },
});

/** Marks unpaid bookings whose hold ran out; availability does not depend on it. */
async function expireStale(where: Prisma.ReservaWhereInput) {
  await getPrisma().reserva.updateMany({ where: { ...where, estado: "pendiente_pago", bloqueoExpiraEn: { lte: new Date() } }, data: { estado: "expirada" } });
}

const opensOn = (service: Service, date: string) => {
  const day = dayOfWeek(date);
  return day !== MONDAY && service.operatingDays.some((operatingDay) => operatingDay === day);
};

async function isBookableDay(service: Service, date: string) {
  const { min, max } = reservationDateBounds();
  return date >= min && date <= max && opensOn(service, date) && !(await isClosedOn(service.id, date));
}

export async function getAvailableSlots(serviceId: string, date: string) {
  const service = await serviceService.getById(serviceId);
  if (!service?.isActive || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(await isBookableDay(service, date))) return [];
  const bookings = await getPrisma().reserva.findMany({
    where: { servicioId: service.id, fecha: toDbDate(date), ...blocking(new Date()) },
    select: { horaInicio: true, horaFin: true, cantidadCupos: true },
  });
  const isToday = date === reservationDateBounds().min;
  const currentHour = bogotaHour();
  return SLOT_HOURS.map((hour) => {
    const time = hourText(hour);
    const end = hourText(hour + 1);
    if (isToday && hour <= currentHour) return { time, remaining: 0 };
    const taken = bookings
      .filter((booking) => fromDbTime(booking.horaInicio) < end && fromDbTime(booking.horaFin) > time)
      .reduce((sum, booking) => sum + booking.cantidadCupos, 0);
    return { time, remaining: Math.max(0, service.capacity - taken) };
  });
}

export async function createReservation(input: {
  userId: string; serviceId: string; date: string; time: string; quantity: number; people: number;
  idNumber: string; acceptedTerms: boolean; containsMinor: boolean; responsibleAdult: string;
}): Promise<string> {
  if (!input.acceptedTerms) throw new Error("Acepta los términos para continuar.");
  const idNumber = input.idNumber.trim();
  if (idNumber.length < 5 || idNumber.length > 30) throw new Error("Revisa el número de documento.");
  const responsibleAdult = input.responsibleAdult.trim();
  if (input.containsMinor && (responsibleAdult.length < 3 || responsibleAdult.length > 120)) throw new Error("Indica el nombre del adulto responsable de los menores.");
  const service = await serviceService.getById(input.serviceId);
  if (!service?.isActive) throw new Error("Este espacio no está disponible por ahora.");
  const { min, max } = reservationDateBounds();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date < min || input.date > max) throw new Error("Elige una fecha entre hoy y los próximos 15 días.");
  if (!opensOn(service, input.date)) throw new Error("Este espacio está cerrado el día seleccionado.");
  if (await isClosedOn(service.id, input.date)) throw new Error("Este espacio tiene un cierre programado para esa fecha.");
  const start = Number(input.time.slice(0, 2));
  if (!/^\d{2}:00$/.test(input.time) || !SLOT_HOURS.includes(start)) throw new Error("El horario debe estar entre las 8:00 a. m. y las 5:00 p. m.");
  if (input.date === min && start <= bogotaHour()) throw new Error("Ese turno ya empezó. Elige una hora futura.");
  const endTime = hourText(start + 1);
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > service.capacity) throw new Error("La cantidad supera los cupos disponibles.");
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > service.capacityPeople) throw new Error("La cantidad de personas supera el aforo de este espacio.");
  if (service.qrType === "individual" && input.quantity !== input.people) throw new Error("Selecciona un cupo QR por cada persona.");
  const subtotal = service.chargeType === "por_persona" ? service.price * input.people : service.price * input.quantity;

  try {
    return await getPrisma().$transaction(async (tx) => {
      // Serializes bookings of the same service and day so the last spot cannot be sold twice.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${service.id + input.date}))`;
      const client = await tx.usuario.findUniqueOrThrow({ where: { id: input.userId } });
      if (client.cedula && client.cedula !== idNumber) throw new Error("El documento no coincide con el registrado en tu cuenta.");
      if (!client.cedula) await tx.usuario.update({ where: { id: client.id }, data: { cedula: idNumber } });
      const now = new Date();
      const sameSlot = { fecha: toDbDate(input.date), ...overlapping(input.time, endTime), AND: [blocking(now)] } satisfies Prisma.ReservaWhereInput;
      if (await tx.reserva.count({ where: { ...sameSlot, clienteId: client.id } })) throw new Error("Ya tienes una reserva activa en ese horario.");
      const taken = await tx.reserva.aggregate({ where: { ...sameSlot, servicioId: service.id }, _sum: { cantidadCupos: true } });
      const remaining = service.capacity - (taken._sum.cantidadCupos ?? 0);
      if (input.quantity > remaining) throw new Error("Quedan " + Math.max(0, remaining) + " cupos en este turno.");
      const booking = await tx.reserva.create({
        data: {
          clienteId: client.id, servicioId: service.id, fecha: toDbDate(input.date), horaInicio: toDbTime(input.time), horaFin: toDbTime(endTime),
          cantidadHoras: 1, cantidadCupos: input.quantity, cantidadPersonas: input.people,
          contieneMenores: input.containsMinor, adultoResponsable: input.containsMinor ? responsibleAdult : null,
          bloqueoExpiraEn: new Date(now.getTime() + PAYMENT_WINDOW_MS), subtotal, descuento: 0, total: subtotal,
          terminos: { create: { clienteId: client.id, versionTerminos: TERMS_VERSION } },
        },
      });
      return booking.id;
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new Error("Ese documento ya está registrado en otra cuenta.");
    throw error;
  }
}

export async function getReservationForUser(id: string, userId: string): Promise<ReservationView | null> {
  if (!isUuid(id)) return null;
  await expireStale({ id });
  const row = await getPrisma().reserva.findFirst({ where: { id, clienteId: userId }, include: viewInclude });
  return row && toView(row);
}

export async function listReservationsForUser(userId: string): Promise<ReservationView[]> {
  await expireStale({ clienteId: userId });
  const rows = await getPrisma().reserva.findMany({ where: { clienteId: userId }, include: viewInclude, orderBy: { creadaEn: "desc" } });
  return rows.map(toView);
}

/** Demo checkout: approves a payment and issues the QR codes. Idempotent. */
export async function completeDemoPayment(id: string, userId: string) {
  const prisma = getPrisma();
  const booking = isUuid(id) ? await prisma.reserva.findFirst({ where: { id, clienteId: userId }, include: { servicio: true, cliente: true } }) : null;
  if (!booking) throw new Error("No encontramos esta reserva.");
  if (booking.estado === "pagada") return;
  if (booking.estado === "expirada" || !booking.bloqueoExpiraEn || booking.bloqueoExpiraEn <= new Date()) {
    await expireStale({ id });
    throw new Error("El bloqueo venció. Vuelve a elegir tu horario.");
  }
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.reserva.updateMany({ where: { id, estado: "pendiente_pago" }, data: { estado: "pagada" } });
    if (!count) return; // Another request already paid it.
    await tx.pago.create({
      data: {
        reservaId: id, pasarela: "demo", referencia: "DEMO-" + randomUUID().slice(0, 8).toUpperCase(), monto: booking.total,
        medioPago: "Tarjeta de prueba", estado: "aprobado", fechaPago: new Date(),
        nombreComprobante: booking.cliente.nombre, cedulaComprobante: booking.cliente.cedula ?? "", correoComprobante: booking.cliente.correo,
      },
    });
    const tickets = booking.servicio.tipoQr === "individual" ? booking.cantidadPersonas : 1;
    await tx.codigoQR.createMany({
      data: Array.from({ length: tickets }, () => ({ reservaId: id, tipo: booking.servicio.tipoQr, codigo: "ELITE-" + randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase() })),
    });
  });
}
