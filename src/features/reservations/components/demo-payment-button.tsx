"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeDemoPaymentAction } from "@/features/reservations/api/reservation.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

function PayButton({ secondary }: { secondary: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className={"club-button payment-button" + (secondary ? " club-button-secondary" : "")} type="submit" disabled={pending}>{pending ? t("Confirmando reserva…") : t("Confirmar reserva")}</button>;
}

/** Demo payment (no real charge). `secondary` renders it as the fallback next to Wompi. */
export function DemoPaymentButton({ reservationId, secondary = false }: { reservationId: string; secondary?: boolean }) {
  const [state, action] = useActionState(completeDemoPaymentAction, {});
  return (
    <form action={action} className="payment-action">
      <input type="hidden" name="reservationId" value={reservationId} />
      {state.error && <p role="alert" className="booking-error">{state.error}</p>}
      <PayButton secondary={secondary} />
    </form>
  );
}
