"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeDemoPaymentAction } from "@/features/reservations/api/reservation.actions";

function PayButton() {
  const { pending } = useFormStatus();
  return <button className="club-button payment-button" type="submit" disabled={pending}>{pending ? "Procesando pago de prueba…" : "Confirmar pago de prueba"} <span aria-hidden="true">→</span></button>;
}

export function DemoPaymentButton({ reservationId }: { reservationId: string }) {
  const [state, action] = useActionState(completeDemoPaymentAction, {});
  return (
    <form action={action} className="payment-action">
      <input type="hidden" name="reservationId" value={reservationId} />
      {state.error && <p role="alert" className="booking-error">{state.error}</p>}
      <PayButton />
    </form>
  );
}
