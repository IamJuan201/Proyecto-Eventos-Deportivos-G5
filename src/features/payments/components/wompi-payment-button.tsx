"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createWompiPaymentAction } from "@/features/payments/api/payment.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

/**
 * Submit button for the Wompi payment form.
 *
 * @returns Button element with a pending-aware label.
 */
function WompiPayButton() {
  const { pending } = useFormStatus();
  const t = useTranslate();
  const busy = pending;
  return (
    <button className="club-button payment-button" type="submit" disabled={busy}>
      {busy ? t("Conectando con Wompi…") : t("Pagar con Wompi")} <span aria-hidden="true">→</span>
    </button>
  );
}

/**
 * Single-button Wompi sandbox payment (cards, PSE and Nequi).
 * The click creates or reuses the pending payment and sends the browser straight
 * to the Wompi checkout; a small link remains in case the redirect is blocked.
 * When Wompi keys are missing it explains the fallback to the demo payment.
 *
 * @param props Component props with the reservation id and customer email.
 * @returns Wompi payment section for the checkout page.
 */
export function WompiPaymentButton({ reservationId, customerEmail }: { reservationId: string; customerEmail: string }) {
  const t = useTranslate();
  const [state, action] = useActionState(createWompiPaymentAction, {});
  const checkoutFormRef = useRef<HTMLFormElement>(null);
  const checkout = state.checkout;

  useEffect(() => {
    const form = checkoutFormRef.current;
    if (!checkout || !form) return;
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else form.submit();
  }, [checkout]);

  return (
    <div className="payment-action">
      <form action={action} className="payment-action-form">
        <input type="hidden" name="reservationId" value={reservationId} />
        {state.error && (
          <p role="alert" className="booking-error">
            {t(state.error)}
          </p>
        )}
        <WompiPayButton />
        <small className="payment-hint">{t("Tarjeta, PSE o Nequi a través del checkout seguro de Wompi (entorno de pruebas).")}</small>
      </form>
      {state.reference && !checkout && (
        <p className="notice-demo" role="status">
          {t("Wompi aún no está configurado en este entorno. Puedes confirmar con el pago de prueba mientras tanto.")}
        </p>
      )}
      {checkout && (
        <form ref={checkoutFormRef} action="https://checkout.wompi.co/p/" method="GET" className="payment-redirect">
          <input type="hidden" name="public-key" value={checkout.publicKey} />
          <input type="hidden" name="currency" value={checkout.currency} />
          <input type="hidden" name="amount-in-cents" value={String(checkout.amountInCents)} />
          <input type="hidden" name="reference" value={checkout.reference} />
          <input type="hidden" name="signature:integrity" value={checkout.integritySignature} />
          {checkout.redirectUrl && (
            <input type="hidden" name="redirect-url" value={`${checkout.redirectUrl}?reference=${checkout.reference}`} />
          )}
          <input type="hidden" name="customer-data:email" value={customerEmail} />
          <p className="payment-hint" role="status">
            {t("Te estamos llevando al checkout seguro de Wompi.")}{" "}
            <button className="small-link" type="submit">{t("Si no se abre, continúa aquí")}</button>
          </p>
        </form>
      )}
    </div>
  );
}
