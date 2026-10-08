"use server";

import { requireRole } from "@/features/auth/lib/session";
import { createWompiPayment } from "@/features/payments/services/payment.service";
import type { WompiCheckoutConfig } from "@/shared/lib/wompi";

/**
 * State returned to the Wompi payment button after preparing checkout.
 */
export interface WompiPaymentState {
  error?: string;
  reference?: string;
  checkout?: WompiCheckoutConfig | null;
}

/**
 * Creates (or reuses) a pending Wompi payment for the reservation.
 * Does not redirect: the client component uses the returned checkout
 * data to open the Wompi sandbox checkout.
 *
 * @param _previous Previous form state (unused, required by useActionState).
 * @param formData Form data containing the reservation id.
 * @returns Payment reference and Widget checkout data, or an error.
 */
export async function createWompiPaymentAction(
  _previous: WompiPaymentState,
  formData: FormData,
): Promise<WompiPaymentState> {
  const user = await requireRole("cliente");
  const reservationId = String(formData.get("reservationId") ?? "");
  try {
    const payment = await createWompiPayment(reservationId, user.id);
    return { reference: payment.reference, checkout: payment.checkout };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo iniciar el pago con Wompi." };
  }
}
