"use server";

import { redirect } from "next/navigation";
import { getJsonCurrentUser } from "@/features/auth/lib/json-auth";
import {
  completeDemoPayment,
  createDemoReservation,
  getAvailableSlots,
  listDemoEmployees,
  scanDemoQr,
} from "@/shared/lib/demo-store";

export type ReservationFormState = { error?: string };
export type PaymentFormState = { error?: string };

export async function loadAvailability(serviceId: string, date: string) {
  return getAvailableSlots(serviceId, date);
}

export async function createReservationAction(_previous: ReservationFormState, formData: FormData): Promise<ReservationFormState> {
  const serviceId = String(formData.get("serviceId") ?? "");
  const user = await getJsonCurrentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/services/" + serviceId));
  if (user.role !== "cliente") redirect(user.role === "admin" ? "/admin/metrics" : "/employee");
  let reservationId: string;
  try {
    const booking = await createDemoReservation({
      serviceId,
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      quantity: Number(formData.get("quantity")),
      people: Number(formData.get("people")),
      name: user.fullName,
      email: user.email ?? "",
      idNumber: String(formData.get("idNumber") ?? ""),
      acceptedTerms: formData.get("acceptedTerms") === "on",
      containsMinor: formData.get("containsMinor") === "on",
      responsibleAdult: String(formData.get("responsibleAdult") ?? ""),
    });
    reservationId = booking.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear la reserva." };
  }
  redirect("/checkout/" + reservationId);
}

export async function completeDemoPaymentAction(_previous: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const reservationId = String(formData.get("reservationId") ?? "");
  try {
    await completeDemoPayment(reservationId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo completar el pago de prueba." };
  }
  redirect("/checkout/" + reservationId);
}

export async function verifyDemoQrAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  if (!code.trim()) return { result: "qr_invalido" as const, message: "Ingresa un código QR." };
  const user = await getJsonCurrentUser();
  if (!user || user.role !== "empleado") return { result: "servicio_incorrecto" as const, message: "Inicia sesión con una cuenta de empleado para validar accesos." };
  const employees = await listDemoEmployees();
  const employee = employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase() && item.isActive);
  if (!employee) return { result: "servicio_incorrecto" as const, message: "Tu cuenta no tiene un espacio activo asignado. Contacta al administrador." };
  return scanDemoQr(code, employee.email, formData.get("minorUnderOneMeter") === "on");
}
