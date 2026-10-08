import "server-only";
import { randomUUID } from "node:crypto";
import { buildCheckoutConfig, isWompiConfigured, type WompiCheckoutConfig } from "@/shared/lib/wompi";
import { isPrismaError, isUuid } from "@/shared/lib/prisma";
import { getPrisma } from "@/shared/lib/prisma";
import { sendReservationQrEmail } from "@/features/payments/services/qr-mail.service";

/**
 * Result of creating (or reusing) a pending Wompi payment.
 */
export interface CreateWompiPaymentResult {
  reference: string;
  amountInCents: number;
  checkout: WompiCheckoutConfig | null;
  reused: boolean;
}

/**
 * Result of applying a Wompi transaction update idempotently.
 */
export interface ConfirmWompiPaymentResult {
  handled: boolean;
  status: "aprobado" | "fallido" | "pendiente" | "ignorado";
  reservationId?: string;
}

/**
 * Builds a unique Wompi payment reference for `Pago.referencia`.
 *
 * @returns Reference such as WOMPI-AB12CD34.
 */
function buildReference(): string {
  return `WOMPI-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Creates a pending Wompi payment for a reservation, or reuses the latest
 * pending one so repeated clicks never flood the reservation with payments.
 * The returned checkout config opens the Wompi Widget (sandbox); when keys
 * are missing it is null and the UI falls back to the demo payment.
 *
 * @param reservaId Reservation id to pay.
 * @param userId Owner of the reservation (must be the cliente role).
 * @returns Payment reference plus Widget checkout data.
 */
export async function createWompiPayment(reservaId: string, userId: string): Promise<CreateWompiPaymentResult> {
  if (!isUuid(reservaId)) throw new Error("No encontramos esta reserva.");
  const prisma = getPrisma();
  const booking = await prisma.reserva.findFirst({
    where: { id: reservaId, clienteId: userId },
    include: { cliente: true },
  });
  if (!booking) throw new Error("No encontramos esta reserva.");
  if (booking.estado === "pagada") throw new Error("Esta reserva ya esta pagada.");
  if (booking.estado === "expirada" || !booking.bloqueoExpiraEn || booking.bloqueoExpiraEn <= new Date()) {
    throw new Error("El bloqueo vencio. Vuelve a elegir tu horario.");
  }
  const existing = await prisma.pago.findFirst({
    where: { reservaId, pasarela: "wompi", estado: "pendiente" },
    orderBy: { id: "desc" },
  });
  if (existing) {
    return {
      reference: existing.referencia,
      amountInCents: Math.round(Number(existing.monto) * 100),
      checkout: buildCheckoutConfig({
        reference: existing.referencia,
        total: Number(existing.monto),
        customerEmail: existing.correoComprobante,
      }),
      reused: true,
    };
  }
  const created = await prisma.pago.create({
    data: {
      reservaId,
      pasarela: "wompi",
      referencia: buildReference(),
      monto: booking.total,
      estado: "pendiente",
      nombreComprobante: booking.cliente.nombre,
      cedulaComprobante: booking.cliente.cedula ?? "",
      correoComprobante: booking.cliente.correo,
    },
  });
  return {
    reference: created.referencia,
    amountInCents: Math.round(Number(created.monto) * 100),
    checkout: buildCheckoutConfig({
      reference: created.referencia,
      total: Number(created.monto),
      customerEmail: created.correoComprobante,
    }),
    reused: false,
  };
}

/**
 * Normalizes a Wompi transaction status to the local payment state.
 *
 * @param status Raw Wompi status (APPROVED, DECLINED, VOIDED, ERROR, PENDING...).
 * @returns Local outcome used by the confirmer.
 */
function normalizeStatus(status: string): "aprobado" | "fallido" | "pendiente" {
  const upper = status.toUpperCase();
  if (upper === "APPROVED") return "aprobado";
  if (upper === "PENDING") return "pendiente";
  return "fallido";
}

/**
 * Applies a Wompi transaction update idempotently.
 * Only a `Pago` in `pendiente` state is ever updated; repeated webhooks
 * for the same reference or transaction id are safe no-ops.
 * On approval it marks the reservation as paid, issues QR codes
 * (one per person for individual services, one per booking for group ones)
 * and queues the QR email without ever reverting the payment on mail failure.
 *
 * @param input Transaction reference, id, status and payment method from Wompi.
 * @returns Confirmation outcome with the reservation id when handled.
 */
export async function confirmWompiPayment(input: {
  reference: string;
  transactionId: string;
  status: string;
  amountInCents: number;
  currency: string;
  paymentMethod?: string | null;
}): Promise<ConfirmWompiPaymentResult> {
  const outcome = normalizeStatus(input.status);
  if (outcome === "pendiente") return { handled: false, status: "pendiente" };
  const prisma = getPrisma();
  const payment = await prisma.pago.findUnique({
    where: { referencia: input.reference },
    include: { reserva: { include: { servicio: true } } },
  });
  if (!payment) return { handled: false, status: "ignorado" };
  if (input.currency !== "COP" || input.amountInCents !== Math.round(Number(payment.monto) * 100)) {
    console.error(`[payments] Ignored Wompi transaction ${input.transactionId}: currency or amount does not match payment ${input.reference}.`);
    return { handled: true, status: "ignorado", reservationId: payment.reservaId };
  }
  if (payment.transaccionId && payment.transaccionId === input.transactionId && payment.estado !== "pendiente") {
    return { handled: true, status: payment.estado === "aprobado" ? "aprobado" : "fallido", reservationId: payment.reservaId };
  }
  if (payment.estado !== "pendiente") return { handled: true, status: "ignorado", reservationId: payment.reservaId };
  if (outcome === "fallido") {
    try {
      await prisma.pago.update({
        where: { id: payment.id },
        data: { estado: "fallido", transaccionId: input.transactionId, medioPago: input.paymentMethod ?? payment.medioPago },
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) return { handled: true, status: "ignorado", reservationId: payment.reservaId };
      throw error;
    }
    return { handled: true, status: "fallido", reservationId: payment.reservaId };
  }
  try {
    const approved = await prisma.$transaction(async (tx) => {
      const booking = await tx.reserva.findUniqueOrThrow({ where: { id: payment.reservaId } });
      if (booking.estado !== "pendiente_pago" || !booking.bloqueoExpiraEn || booking.bloqueoExpiraEn <= new Date()) {
        await tx.pago.updateMany({
          where: { id: payment.id, estado: "pendiente" },
          data: { estado: "fallido", transaccionId: input.transactionId },
        });
        return false;
      }
      const { count } = await tx.reserva.updateMany({
        where: { id: payment.reservaId, estado: "pendiente_pago", bloqueoExpiraEn: { gt: new Date() } },
        data: { estado: "pagada" },
      });
      if (!count) {
        await tx.pago.updateMany({
          where: { id: payment.id, estado: "pendiente" },
          data: { estado: "fallido", transaccionId: input.transactionId },
        });
        return false;
      }
      await tx.pago.update({
        where: { id: payment.id },
        data: {
          estado: "aprobado",
          transaccionId: input.transactionId,
          medioPago: input.paymentMethod ?? "Wompi",
          fechaPago: new Date(),
        },
      });
      const tickets = payment.reserva.servicio.tipoQr === "individual" ? booking.cantidadPersonas : 1;
      await tx.codigoQR.createMany({
        data: Array.from({ length: tickets }, () => ({
          reservaId: payment.reservaId,
          tipo: payment.reserva.servicio.tipoQr,
          codigo: `ELITE-${randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase()}`,
        })),
      });
      return true;
    });
    if (!approved) return { handled: true, status: "fallido", reservationId: payment.reservaId };
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { handled: true, status: "ignorado", reservationId: payment.reservaId };
    }
    throw error;
  }
  sendReservationQrEmail(payment.reservaId).catch((error) => {
    console.error(`[payments] QR email failed for reservation ${payment.reservaId}:`, error);
  });
  return { handled: true, status: "aprobado", reservationId: payment.reservaId };
}
