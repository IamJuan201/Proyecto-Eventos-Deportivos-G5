"use server";

import { redirect } from "next/navigation";
import { scanQr } from "@/features/access-control/services/access.service";
import { getCurrentUser, requireRole } from "@/features/auth/lib/session";
import { getActiveStaffByUser } from "@/features/employees/services/staff.service";
import { completeDemoPayment, createReservation, getAvailableSlots } from "@/features/reservations/services/reservation.service";

export type ReservationFormState = { error?: string };
export type PaymentFormState = { error?: string };

export async function loadAvailability(serviceId: string, date: string) {
  return getAvailableSlots(serviceId, date);
}

export async function createReservationAction(_previous: ReservationFormState, formData: FormData): Promise<ReservationFormState> {
  const serviceId = String(formData.get("serviceId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/services/" + serviceId));
  if (user.role !== "cliente") redirect(user.role === "admin" ? "/admin/metrics" : "/employee");
  let reservationId: string;
  try {
    reservationId = await createReservation({
      userId: user.id,
      serviceId,
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      quantity: Number(formData.get("quantity")),
      people: Number(formData.get("people")),
      idNumber: String(formData.get("idNumber") ?? ""),
      acceptedTerms: formData.get("acceptedTerms") === "on",
      containsMinor: formData.get("containsMinor") === "on",
      responsibleAdult: String(formData.get("responsibleAdult") ?? ""),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear la reserva." };
  }
  redirect("/checkout/" + reservationId);
}

export async function completeDemoPaymentAction(_previous: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const user = await requireRole("cliente");
  const reservationId = String(formData.get("reservationId") ?? "");
  try {
    await completeDemoPayment(reservationId, user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo confirmar la reserva." };
  }
  redirect("/checkout/" + reservationId);
}

export async function verifyQrAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  if (!code.trim()) return { result: "qr_invalido" as const, message: "Ingresa un código QR." };
  const user = await getCurrentUser();
  if (!user || user.role !== "empleado") return { result: "servicio_incorrecto" as const, message: "Inicia sesión con una cuenta de empleado para validar accesos." };
  const staff = await getActiveStaffByUser(user.id);
  if (!staff) return { result: "servicio_incorrecto" as const, message: "Tu cuenta no tiene un espacio activo asignado. Contacta al administrador." };
  return scanQr(code, staff, formData.get("minorUnderOneMeter") === "on");
}
