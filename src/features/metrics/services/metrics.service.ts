import { getPrisma } from "@/shared/lib/prisma";

export interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  startTime: string;
  total: number;
}

export interface DashboardMetrics {
  approvedIncome: number;
  paidBookings: number;
  bookedPeople: number;
  allowedAccesses: number;
  accessReads: number;
  activeEmployees: number;
  recentBookings: RecentBooking[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const prisma = getPrisma();
  const [income, paid, allowedAccesses, accessReads, activeEmployees, recent] = await Promise.all([
    prisma.pago.aggregate({ where: { estado: "aprobado" }, _sum: { monto: true } }),
    prisma.reserva.aggregate({ where: { estado: "pagada" }, _count: true, _sum: { cantidadPersonas: true } }),
    prisma.registroAcceso.count({ where: { resultado: "permitido" } }),
    prisma.registroAcceso.count(),
    prisma.empleado.count({ where: { activo: true, eliminadoEn: null } }),
    prisma.reserva.findMany({
      where: { estado: "pagada" },
      orderBy: { creadaEn: "desc" },
      take: 5,
      include: { servicio: { select: { nombre: true } }, cliente: { select: { nombre: true } } },
    }),
  ]);

  return {
    approvedIncome: Number(income._sum.monto ?? 0),
    paidBookings: paid._count,
    bookedPeople: paid._sum.cantidadPersonas ?? 0,
    allowedAccesses,
    accessReads,
    activeEmployees,
    recentBookings: recent.map((booking) => ({
      id: booking.id,
      serviceName: booking.servicio.nombre,
      customerName: booking.cliente.nombre,
      date: booking.fecha.toISOString().slice(0, 10),
      startTime: booking.horaInicio.toISOString().slice(11, 16),
      total: Number(booking.total),
    })),
  };
}
