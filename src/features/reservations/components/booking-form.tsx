"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createReservationAction, loadAvailability } from "@/features/reservations/api/reservation.actions";
import type { Service } from "@/features/services/types/service.types";
import { useTranslate } from "@/shared/i18n/locale-provider";

const AVAILABILITY_REFRESH_MS = 30_000;
const money = (amount: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);

function ReserveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslate();
  return <button className="club-button" type="submit" disabled={disabled || pending}>{pending ? t("Guardando tu espacio…") : t("Continuar al pago")}</button>;
}

export function BookingForm({ service, minDate, maxDate }: { service: Service; minDate: string; maxDate: string }) {
  const t = useTranslate();
  const [state, action] = useActionState(createReservationAction, {});
  const [date, setDate] = useState(minDate);
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<{ date: string; slots: { time: string; remaining: number }[] } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [people, setPeople] = useState(1);
  const [containsMinor, setContainsMinor] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = (isFirstLoad: boolean) => loadAvailability(service.id, date).then((result) => {
      if (!active) return;
      const available = result.filter((slot) => slot.remaining > 0);
      setAvailability({ date, slots: available });
      // A background refresh never swaps the chosen slot for another one: if it sold out, the client picks again.
      setTime((current) => available.some((slot) => slot.time === current) ? current : isFirstLoad ? available[0]?.time ?? "" : "");
    }).catch(() => {
      // A failed background refresh keeps the last good availability.
      if (active && isFirstLoad) { setAvailability({ date, slots: [] }); setTime(""); }
    });
    refresh(true);
    // Spots change while the page is open (other clients book, holds expire): re-check while the tab is visible.
    const refreshIfVisible = () => { if (document.visibilityState === "visible") refresh(false); };
    const timer = setInterval(refreshIfVisible, AVAILABILITY_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", refreshIfVisible); };
  }, [date, service.id]);

  const slots = availability?.date === date ? availability.slots : [];
  const loadingSlots = availability?.date !== date;
  const maxQuantity = service.qrType === "individual" ? service.capacityPeople : service.capacity;
  const maxPeople = service.capacityPeople;
  const estimated = service.chargeType === "por_persona" ? service.price * people : service.price * quantity;

  function updateQuantity(value: number) {
    setQuantity(value);
    if (service.qrType === "individual") setPeople(value);
  }

  return (
    <form action={action} className="booking-form">
      <input type="hidden" name="serviceId" value={service.id} />
      <div className="booking-field">
        <label htmlFor="booking-date">{t("Fecha de tu visita")}</label>
        <input id="booking-date" className="club-input" name="date" type="date" min={minDate} max={maxDate} value={date} onChange={(event) => setDate(event.target.value)} required />
        <small className="field-hint">{t("Reserva hasta 15 días antes. El complejo cierra los lunes y los festivos.")}</small>
      </div>

      <div className="booking-field">
        <span className="field-label">{t("Turno · 1 hora")}</span>
        {loadingSlots ? <p className="field-hint">{t("Consultando disponibilidad…")}</p> : slots.length ? (
          <div className="booking-time-grid">
            {slots.map((slot) => (
              <label className="booking-slot" key={slot.time}>
                <input type="radio" name="time" value={slot.time} checked={time === slot.time} onChange={() => setTime(slot.time)} />
                {slot.time}
                <span className="slot-count">{slot.remaining} {t("disp.")}</span>
              </label>
            ))}
          </div>
        ) : <div className="empty-state">{t("No hay turnos disponibles para esta fecha. Elige otro día.")}</div>}
      </div>

      <div className="booking-count-grid">
        <div className="booking-field">
          <label htmlFor="booking-quantity">{t(service.qrType === "grupal" ? "Canchas" : "Personas")}</label>
          <select id="booking-quantity" className="club-input" name="quantity" value={quantity} onChange={(event) => updateQuantity(Number(event.target.value))}>
            {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((count) => <option value={count} key={count}>{count}</option>)}
          </select>
          <small className="field-hint">{t(service.qrType === "individual" ? "Cada persona recibe su QR." : "Se genera un QR para todo el equipo.")}</small>
        </div>
        {service.qrType === "grupal" && <div className="booking-field">
          <label htmlFor="booking-people">{t("Personas (máx.")} {maxPeople})</label>
          <select id="booking-people" className="club-input" name="people" value={people} onChange={(event) => setPeople(Number(event.target.value))}>
            {Array.from({ length: maxPeople }, (_, index) => index + 1).map((count) => <option value={count} key={count}>{count}</option>)}
          </select>
          <small className="field-hint">{t("Indica el tamaño del grupo.")}</small>
        </div>}
      </div>
      {service.qrType === "individual" && <input type="hidden" name="people" value={people} />}

      <div className="booking-field">
        <span className="field-label">{t("Titular de la reserva")}</span>
        <p className="field-hint">{t("Usaremos los datos de tu cuenta para identificar la reserva.")}</p>
        <input className="club-input" name="idNumber" placeholder={t("Número de documento")} minLength={5} required />
      </div>
      <label className="terms-label minor-check"><input type="checkbox" name="containsMinor" checked={containsMinor} onChange={(event) => setContainsMinor(event.target.checked)} /><span>{t("En el grupo vienen menores de edad.")}</span></label>
      {containsMinor && <div className="booking-field"><label htmlFor="adult-responsible">{t("Adulto responsable")}</label><input id="adult-responsible" className="club-input" name="responsibleAdult" placeholder={t("Nombre del adulto responsable")} minLength={3} required /><small className="field-hint">{t("Los menores deben ingresar acompañados por un adulto.")}</small></div>}

      <div className="booking-price"><span>{t("Estimado")} · {t(service.chargeType === "por_persona" ? "por persona" : "por espacio / hora")}</span><strong>{money(estimated)}</strong></div>
      <label className="terms-label"><input type="checkbox" name="acceptedTerms" required /><span>{t("Acepto los términos de reserva, incluyendo el plazo de 10 minutos para completar el pago y la política de no devolución.")}</span></label>
      {state.error && <p role="alert" className="booking-error">{state.error}</p>}
      <ReserveButton disabled={!time || loadingSlots || !slots.length} />
      <p className="field-hint center-note">{t("El pago en línea aún no está habilitado. La confirmación no realizará ningún cobro.")}</p>
    </form>
  );
}
