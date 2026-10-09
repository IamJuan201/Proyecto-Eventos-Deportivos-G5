"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeDemoPaymentAction } from "@/features/reservations/api/reservation.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

function PayButton() {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className="club-button payment-button" type="submit" disabled={pending}>{pending ? t("Confirmando reserva…") : t("Confirmar reserva")}</button>;
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
