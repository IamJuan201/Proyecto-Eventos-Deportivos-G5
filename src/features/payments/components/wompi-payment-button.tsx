"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createWompiPaymentAction } from "@/features/payments/api/payment.actions";

/**
 * Submit button label for the Wompi payment form.
 *
 * @returns Button element with a pending-aware label.
 */
function WompiPayButton() {
  const { pending } = useFormStatus();
  return (
    <button className="club-button payment-button" type="submit" disabled={pending}>
      {pending ? "Conectando con Wompi…" : "Pagar en línea con Wompi"} <span aria-hidden="true">→</span>
    </button>
  );
}

/**
 * Starts a Wompi sandbox payment and renders the redirect form.
 * When Wompi keys are missing it explains the fallback to the demo payment.
 * Supports cards, PSE and Nequi through the Wompi checkout.
 *
 * @param props Component props with the reservation id and customer email.
 * @returns Wompi payment section for the checkout page.
 */
export function WompiPaymentButton({ reservationId, customerEmail }: { reservationId: string; customerEmail: string }) {
  const [state, action] = useActionState(createWompiPaymentAction, {});
  return (
    <div className="payment-action">
      <form action={action}>
        <input type="hidden" name="reservationId" value={reservationId} />
        {state.error && (
          <p role="alert" className="booking-error">
            {state.error}
          </p>
        )}
        <WompiPayButton />
      </form>
      {state.reference && !state.checkout && (
        <p className="notice-demo">
          Wompi aún no está configurado en este entorno (faltan las claves de sandbox). Puedes confirmar con el pago
          de prueba mientras tanto.
        </p>
      )}
      {state.reference && state.checkout && (
        <form action="https://checkout.wompi.co/p/" method="GET" className="payment-action">
          <input type="hidden" name="public-key" value={state.checkout.publicKey} />
          <input type="hidden" name="currency" value={state.checkout.currency} />
          <input type="hidden" name="amount-in-cents" value={String(state.checkout.amountInCents)} />
          <input type="hidden" name="reference" value={state.checkout.reference} />
          <input type="hidden" name="signature:integrity" value={state.checkout.integritySignature} />
          {state.checkout.redirectUrl && (
            <input type="hidden" name="redirect-url" value={`${state.checkout.redirectUrl}?reference=${state.checkout.reference}`} />
          )}
          <input type="hidden" name="customer-data:email" value={customerEmail} />
          <p className="notice-demo">
            Referencia {state.reference}. Serás redirigido al checkout seguro de Wompi (tarjeta, PSE o Nequi).
            {state.checkout.redirectUrl ? (
              " Al finalizar volverás a tu reserva."
            ) : (
              " Al finalizar, vuelve a esta página: tu reserva se confirma sola en cuanto Wompi avisa al servidor."
            )}
          </p>
          <button className="club-button payment-button" type="submit">
            Continuar al checkout seguro <span aria-hidden="true">→</span>
          </button>
        </form>
      )}
    </div>
  );
}
