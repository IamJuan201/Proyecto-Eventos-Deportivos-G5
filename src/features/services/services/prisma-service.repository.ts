import "server-only";
import type { HorarioServicio, Prisma, Servicio } from "@/generated/prisma/client";
import type { ServiceRepository } from "@/features/services/services/service.repository";
import type { Service, ServiceIcon, ServiceInput, WeekDay } from "@/features/services/types/service.types";
import { bogotaDate, dayOfWeek, fromDbDate, toDbDate, toDbTime } from "@/shared/lib/bogota-time";
import { getPrisma, isPrismaError, isUuid } from "@/shared/lib/prisma";

/** The complex opens 08:00–17:00; every operating day is one HorarioServicio row. */
const OPENING_TIME = "08:00";
const CLOSING_TIME = "17:00";

const withSchedule = { horarios: { where: { activo: true }, orderBy: { diaSemana: "asc" } } } satisfies Prisma.ServicioInclude;

export const toService = (row: Servicio & { horarios: HorarioServicio[] }): Service => ({
  id: row.id,
  categoryId: row.categoriaId,
  name: row.nombre,
  description: row.descripcion,
  imageUrl: row.imagenUrl ?? "",
  price: Number(row.precio),
  capacity: row.capacidadPorHora,
  capacityPeople: row.capacidadPersonas,
  chargeType: row.tipoCobro,
  qrType: row.tipoQr,
  operatingDays: [...new Set(row.horarios.map((horario) => horario.diaSemana as WeekDay))],
  icon: (row.icono ?? "court") as ServiceIcon,
  tag: row.etiqueta ?? "",
  isActive: row.activo,
});

const toData = (input: ServiceInput) => ({
  categoriaId: input.categoryId,
  nombre: input.name,
  descripcion: input.description,
  precio: input.price,
  tipoCobro: input.chargeType,
  capacidadPorHora: input.capacity,
  capacidadPersonas: input.capacityPeople,
  tipoQr: input.qrType,
  imagenUrl: input.imageUrl || null,
  icono: input.icon,
  etiqueta: input.tag || null,
});

const toSchedule = (days: WeekDay[]) =>
  days.map((day) => ({ diaSemana: day, horaInicio: toDbTime(OPENING_TIME), horaFin: toDbTime(CLOSING_TIME) }));

export const prismaServiceRepository: ServiceRepository = {
  async list() {
    const rows = await getPrisma().servicio.findMany({ include: withSchedule, orderBy: { nombre: "asc" } });
    return rows.map(toService);
  },
  async getById(id) {
    if (!isUuid(id)) return null;
    const row = await getPrisma().servicio.findUnique({ where: { id }, include: withSchedule });
    return row && toService(row);
  },
  async create(input) {
    const row = await getPrisma().servicio.create({
      data: { ...toData(input), horarios: { create: toSchedule(input.operatingDays) } },
      include: withSchedule,
    });
    return toService(row);
  },
  async update(id, input) {
    const row = await getPrisma().servicio.update({
      where: { id },
      data: { ...toData(input), horarios: { deleteMany: {}, create: toSchedule(input.operatingDays) } },
      include: withSchedule,
    });
    return toService(row);
  },
  async setActive(id, isActive) {
    return toService(await getPrisma().servicio.update({ where: { id }, data: { activo: isActive }, include: withSchedule }));
  },
  async delete(id) {
    try {
      await getPrisma().servicio.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, "P2003")) {
        throw new Error("Este espacio tiene reservas, empleados o accesos registrados. Desactívalo para retirarlo del catálogo.");
      }
      throw error;
    }
  },
  async bookedWeekDays(id) {
    if (!isUuid(id)) return [];
    const rows = await getPrisma().reserva.findMany({
      where: {
        servicioId: id,
        fecha: { gte: toDbDate(bogotaDate()) },
        OR: [{ estado: "pagada" }, { estado: "pendiente_pago", bloqueoExpiraEn: { gt: new Date() } }],
      },
      select: { fecha: true },
      distinct: ["fecha"],
    });
    return [...new Set(rows.map((row) => dayOfWeek(fromDbDate(row.fecha)) as WeekDay))];
  },
};
