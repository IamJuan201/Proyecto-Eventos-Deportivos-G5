import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { WompiPaymentButton } from "@/features/payments/components/wompi-payment-button";
import { DemoPaymentButton } from "@/features/reservations/components/demo-payment-button";
import { requireRole } from "@/features/auth/lib/session";
import { getReservationForUser } from "@/features/reservations/services/reservation.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";
import { isWompiConfigured } from "@/shared/lib/wompi";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const dateText = (value: string, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(new Date(value + "T12:00:00-05:00"));

export default async function CheckoutPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const wompiConfigured = isWompiConfigured();
  const user = await requireRole("cliente");
  const reservation = await getReservationForUser(reservationId, user.id);
  if (!reservation) notFound();

  const ticketImages = reservation.status === "pagada"
    ? await Promise.all(reservation.qrs.map((qr) => QRCode.toDataURL(qr.code, { width: 300, margin: 1, color: { dark: "#0B0F15", light: "#FFFFFF" }, errorCorrectionLevel: "M" })))
    : [];

  return (
    <main className="club-container checkout-wrap">
      <Link className="back-link" href="/services">← {t("Volver a los espacios")}</Link>
      <div className="checkout-title"><span className="eyebrow">{t(reservation.status === "pagada" ? "RESERVA CONFIRMADA" : reservation.status === "expirada" ? "TIEMPO DE PAGO AGOTADO" : "ÚLTIMO PASO")}</span><h1>{t(reservation.status === "pagada" ? "Tu espacio ya es tuyo." : reservation.status === "expirada" ? "El turno volvió a estar disponible." : "Confirma tu reserva.")}</h1><p>{t(reservation.status === "pagada" ? "Guarda tu QR y preséntalo al llegar al complejo." : reservation.status === "expirada" ? "El bloqueo de 10 minutos venció. Elige un horario nuevo para continuar." : "Revisa los datos antes de completar el pago.")}</p></div>
      <section className="glass-panel checkout-card">
        <div className="checkout-brand"><span className="brand-mark">É</span><div><strong>ÉLITE CLUB</strong><small>{t("COMPROBANTE DE RESERVA")}</small></div><span className={"booking-status status-" + reservation.status}>{t(reservation.status.replace("_", " "))}</span></div>
        <div className="checkout-details">
          <div><small>{t("Espacio")}</small><strong>{t(reservation.serviceName)}</strong></div>
          <div><small>{t("Fecha")}</small><strong>{dateText(reservation.date, locale)}</strong></div>
          <div><small>{t("Horario")}</small><strong>{reservation.startTime} — {reservation.endTime}</strong></div>
          <div><small>{t("Reserva a nombre de")}</small><strong>{reservation.customerName}</strong></div>
          <div><small>{t("Personas")}</small><strong>{reservation.people}</strong></div>
          <div><small>{t("Correo")}</small><strong>{reservation.customerEmail}</strong></div>
        </div>
        <div className="checkout-total"><span><small>{t("SUBTOTAL")}</small><strong>{money(reservation.subtotal)}</strong></span><span><small>{t("TOTAL A PAGAR")}</small><strong>{money(reservation.total)}</strong></span></div>

        {reservation.status === "pendiente_pago" && <>
          <div className="payment-deadline"><span>◷</span><p>{t("Tu horario está bloqueado durante 10 minutos, hasta las")} <strong>{reservation.paymentExpiresAt && new Date(reservation.paymentExpiresAt).toLocaleTimeString(locale === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" })}</strong>.</p></div>
          {wompiConfigured ? <>
            <div className="notice-demo"><strong>{t("Pago en línea (sandbox):")}</strong> {t("Paga con tarjeta, PSE o Nequi a través de Wompi. Recibirás tus QR en pantalla y por correo.")}</div>
            <WompiPaymentButton reservationId={reservation.id} customerEmail={reservation.customerEmail} />
          </> : <>
            <div className="notice-demo"><strong>{t("Modo demostración:")}</strong> {t("Wompi no está configurado. El botón de prueba registra un pago simulado y genera los QR sin cobrar dinero real.")}</div>
            <DemoPaymentButton reservationId={reservation.id} />
          </>}
        </>}

        {reservation.status === "expirada" && <Link className="club-button" href={"/services/" + reservation.serviceId}>{t("Elegir otro horario")}</Link>}

        {reservation.status === "pagada" && reservation.payment && <>
          <div className="payment-confirmed"><span aria-hidden="true">✓</span><div><strong>{t("Pago aprobado")}</strong><small>{t("Referencia")} {reservation.payment.reference} · {new Date(reservation.payment.paidAt).toLocaleString(locale === "en" ? "en-US" : "es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" })}</small></div></div>
          <h2 className="tickets-title">{t("Tus códigos de acceso")} <span>{reservation.qrs.length} QR</span></h2>
          <p className="tickets-hint">{t(reservation.qrs.length > 1 ? "Cada persona presenta su propio código al empleado del servicio." : "Presenta este código al empleado del servicio al llegar.")}</p>
          <div className="qr-grid">
            {reservation.qrs.map((qr, index) => <article className="qr-ticket" key={qr.id}><span>ÉLITE CLUB · {reservation.qrs.length > 1 ? t("INVITADO") + " " + (index + 1) : t("ACCESO")}</span><Image src={ticketImages[index]} alt={t("Código QR de acceso") + " " + (index + 1)} width={132} height={132} unoptimized /><code>{qr.code}</code><small>{reservation.date} · {reservation.startTime}—{reservation.endTime}</small></article>)}
          </div>
          <div className="notice-demo ticket-notice">{t("El QR estará activo solo en la fecha y turno de tu reserva. Para probar el escáner, ingresa con la cámara o el código alfanumérico en la sección")} <Link href="/scanner">{t("Acceso empleados")}</Link>.</div>
        </>}
      </section>
    </main>
  );
}
