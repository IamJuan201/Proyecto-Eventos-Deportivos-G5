import { bogotaDate } from "@/shared/lib/bogota-time";
import { getPrisma } from "@/shared/lib/prisma";

export interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  startTime: string;
  total: number;
}

/** A period with the highest approved sales. `start` is a Bogota "YYYY-MM-DD" (week: its Monday; month: day 01). */
export interface SalesPeak {
  start: string;
  total: number;
  payments: number;
}

export interface RevenueMonth {
  month: string;
  revenue: number;
  payments: number;
}

export interface DashboardMetrics {
  approvedIncome: number;
  paidBookings: number;
  bookedPeople: number;
  allowedAccesses: number;
  accessReads: number;
  activeEmployees: number;
  recentBookings: RecentBooking[];
  revenueHistory: RevenueMonth[];
  revenueTrend: RevenueMonth[];
  bookingStates: { paid: number; pending: number; expired: number };
  salesPeaks: { day: SalesPeak | null; week: SalesPeak | null; month: SalesPeak | null };
}

const weekStart = (date: string) => {
  const monday = new Date(date + "T12:00:00Z");
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
};

/** Groups approved payments by the period of their payment date (fecha_pago, Bogota) and keeps the top one by amount; ties go to the earliest period. */
function topPeriod(payments: { date: string; amount: number }[], periodOf: (date: string) => string): SalesPeak | null {
  const totals = new Map<string, SalesPeak>();
  for (const { date, amount } of payments) {
    const start = periodOf(date);
    const peak = totals.get(start) ?? { start, total: 0, payments: 0 };
    peak.total += amount;
    peak.payments += 1;
    totals.set(start, peak);
  }
  return [...totals.values()].reduce<SalesPeak | null>((best, peak) => (!best || peak.total > best.total ? peak : best), null);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const prisma = getPrisma();
  const [income, paid, pendingBookings, expiredBookings, allowedAccesses, accessReads, activeEmployees, recent, approvedPayments] = await Promise.all([
    prisma.pago.aggregate({ where: { estado: "aprobado" }, _sum: { monto: true } }),
    prisma.reserva.aggregate({ where: { estado: "pagada" }, _count: true, _sum: { cantidadPersonas: true } }),
    prisma.reserva.count({ where: { estado: "pendiente_pago" } }),
    prisma.reserva.count({ where: { estado: "expirada" } }),
    prisma.registroAcceso.count({ where: { resultado: "permitido" } }),
    prisma.registroAcceso.count(),
    prisma.empleado.count({ where: { activo: true, eliminadoEn: null } }),
    prisma.reserva.findMany({
      where: { estado: "pagada" },
      orderBy: { creadaEn: "desc" },
      take: 5,
      include: { servicio: { select: { nombre: true } }, cliente: { select: { nombre: true } } },
    }),
    prisma.pago.findMany({ where: { estado: "aprobado", fechaPago: { not: null } }, select: { fechaPago: true, monto: true }, orderBy: { fechaPago: "asc" } }),
  ]);
  const currentDate = bogotaDate();
  const currentMonth = currentDate.slice(0, 7);
  const payments = approvedPayments
    .map((payment) => ({ date: bogotaDate(payment.fechaPago!), amount: Number(payment.monto) }))
    .filter((payment) => payment.date <= currentDate);
  const firstMonth = new Date(`${currentMonth}-01T12:00:00Z`);
  firstMonth.setUTCMonth(firstMonth.getUTCMonth() - 5);
  const recentMonthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(firstMonth);
    date.setUTCMonth(firstMonth.getUTCMonth() + index);
    return date.toISOString().slice(0, 7);
  });
  const firstPaymentMonth = payments.reduce<string | null>((earliest, payment) => {
    const paymentMonth = payment.date.slice(0, 7);
    return earliest === null || paymentMonth < earliest ? paymentMonth : earliest;
  }, null);
  const historyMonthKeys: string[] = [];
  if (payments.length) {
    const minimumHistoryMonth = new Date(`${currentMonth}-01T12:00:00Z`);
    minimumHistoryMonth.setUTCMonth(minimumHistoryMonth.getUTCMonth() - 11);
    const minimumHistoryKey = minimumHistoryMonth.toISOString().slice(0, 7);
    const historyStart = firstPaymentMonth && firstPaymentMonth < minimumHistoryKey ? firstPaymentMonth : minimumHistoryKey;
    const cursor = new Date(`${historyStart}-01T12:00:00Z`);
    const last = new Date(`${currentMonth}-01T12:00:00Z`);
    while (cursor <= last) {
      historyMonthKeys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  const buildMonthlyTotals = (monthKeys: string[]) => {
    const totals = new Map(monthKeys.map((month) => [month, { revenue: 0, payments: 0 }]));
    for (const payment of payments) {
      const total = totals.get(payment.date.slice(0, 7));
      if (total) {
        total.revenue += payment.amount;
        total.payments += 1;
      }
    }
    return monthKeys.map((month) => ({ month, ...totals.get(month)! }));
  };

  return {
    approvedIncome: Number(income._sum.monto ?? 0),
    paidBookings: paid._count,
    bookedPeople: paid._sum.cantidadPersonas ?? 0,
    allowedAccesses,
    accessReads,
    activeEmployees,
    bookingStates: { paid: paid._count, pending: pendingBookings, expired: expiredBookings },
    revenueHistory: buildMonthlyTotals(historyMonthKeys),
    revenueTrend: payments.length ? buildMonthlyTotals(recentMonthKeys) : [],
    recentBookings: recent.map((booking) => ({
      id: booking.id,
      serviceName: booking.servicio.nombre,
      customerName: booking.cliente.nombre,
      date: booking.fecha.toISOString().slice(0, 10),
      startTime: booking.horaInicio.toISOString().slice(11, 16),
      total: Number(booking.total),
    })),
    salesPeaks: {
      day: topPeriod(payments, (date) => date),
      week: topPeriod(payments, weekStart),
      month: topPeriod(payments, (date) => date.slice(0, 8) + "01"),
    },
  };
}
