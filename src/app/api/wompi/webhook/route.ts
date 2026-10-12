import { NextResponse } from "next/server";
import { confirmWompiPayment } from "@/features/payments/services/payment.service";
import { isValidEventChecksum, type WompiTransactionEvent } from "@/shared/lib/wompi";

/**
 * Wompi webhook: applies `transaction.updated` events idempotently.
 * Validates the event checksum before touching the database and only
 * ever updates a `Pago` in `pendiente` state.
 *
 * @param request Incoming POST request from Wompi.
 * @returns JSON acknowledgement for Wompi retries.
 */
export async function POST(request: Request) {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  if (!eventsSecret || eventsSecret.includes("<")) {
    return NextResponse.json({ message: "Wompi webhook is not configured." }, { status: 503 });
  }
  let payload: WompiTransactionEvent;
  try {
    payload = (await request.json()) as WompiTransactionEvent;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }
  if (payload?.event !== "transaction.updated") {
    return NextResponse.json({ received: true, ignored: true });
  }
  const headerChecksum = (request.headers.get("x-event-checksum") ?? "").toLowerCase();
  if (headerChecksum) {
    payload = { ...payload, signature: { ...payload.signature, checksum: headerChecksum } };
  }
  if (!isValidEventChecksum(payload, eventsSecret)) {
    return NextResponse.json({ message: "Invalid event signature." }, { status: 401 });
  }
  const transaction = payload.data?.transaction;
  const reference = typeof transaction?.reference === "string" ? transaction.reference : "";
  const transactionId = typeof transaction?.id === "string" ? transaction.id : "";
  const status = typeof transaction?.status === "string" ? transaction.status : "";
  const amountInCents = typeof transaction?.amountInCents === "number"
    ? transaction.amountInCents
    : typeof transaction?.amount_in_cents === "number"
      ? transaction.amount_in_cents
      : null;
  const currency = typeof transaction?.currency === "string" ? transaction.currency : "";
  if (!reference || !transactionId || !status || amountInCents === null || !currency) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const method =
    typeof transaction?.paymentMethodType === "string"
      ? transaction.paymentMethodType
      : typeof transaction?.payment_method_type === "string"
        ? transaction.payment_method_type
        : null;
  const result = await confirmWompiPayment({ reference, transactionId, status, amountInCents, currency, paymentMethod: method });
  return NextResponse.json({ received: true, status: result.status });
}
