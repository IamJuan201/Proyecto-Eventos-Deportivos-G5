import { getCurrentUser } from "@/features/auth/lib/session";
import { getPrisma } from "@/shared/lib/prisma";
import { getDashboardMetrics } from "@/features/metrics/services/metrics.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const [metrics, reservations] = await Promise.all([getDashboardMetrics(), getPrisma().reserva.findMany({
    orderBy: [{ fecha: "desc" }, { horaInicio: "desc" }],
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      cantidadPersonas: true,
      estado: true,
      subtotal: true,
      descuento: true,
      total: true,
      creadaEn: true,
      cliente: { select: { nombre: true } },
      servicio: { select: { nombre: true } },
      pagos: {
        where: { estado: "aprobado" },
        select: { monto: true, fechaPago: true },
        orderBy: { fechaPago: "desc" },
      },
    },
  })]);

  return Response.json({
    metrics,
    bookings: reservations.map((reservation) => ({
      id: reservation.id,
      customer: reservation.cliente.nombre,
      service: reservation.servicio.nombre,
      date: reservation.fecha.toISOString().slice(0, 10),
      startTime: reservation.horaInicio.toISOString().slice(11, 16),
      endTime: reservation.horaFin.toISOString().slice(11, 16),
      people: reservation.cantidadPersonas,
      status: reservation.estado,
      subtotal: Number(reservation.subtotal),
      discount: Number(reservation.descuento),
      total: Number(reservation.total),
      paidAmount: reservation.pagos.reduce((sum, payment) => sum + Number(payment.monto), 0),
      paidAt: reservation.pagos[0]?.fechaPago?.toISOString() ?? "",
      createdAt: reservation.creadaEn.toISOString(),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
