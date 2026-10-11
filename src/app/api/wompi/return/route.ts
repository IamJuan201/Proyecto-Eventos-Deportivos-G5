import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/lib/prisma";

/**
 * Browser return URL after a Wompi checkout.
 * Resolves the payment reference (or Wompi transaction id) to the
 * reservation and redirects to its checkout page.
 *
 * @param request Incoming GET request from the customer browser.
 * @returns Redirect to the reservation checkout or the history page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  const transactionId = url.searchParams.get("id") ?? url.searchParams.get("transactionId") ?? "";
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const base = appUrl || url.origin;
  try {
    const prisma = getPrisma();
    const payment = reference
      ? await prisma.pago.findUnique({ where: { referencia: reference }, select: { reservaId: true } })
      : transactionId
        ? await prisma.pago.findUnique({ where: { transaccionId: transactionId }, select: { reservaId: true } })
        : null;
    if (payment) return NextResponse.redirect(`${base}/checkout/${payment.reservaId}`);
  } catch {
    // Fall through to the history page when the lookup fails.
  }
  return NextResponse.redirect(`${base}/my-reservations`);
}
