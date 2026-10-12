import "server-only";
import QRCode from "qrcode";
import { sendEmail, type EmailResult } from "@/shared/lib/email";
import { getPrisma } from "@/shared/lib/prisma";

/**
 * Data needed to render the QR confirmation email.
 */
interface QrEmailData {
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  recipient: string;
  reference: string;
  containsMinors: boolean;
  responsibleAdult: string | null;
  codes: string[];
}

/**
 * Formats a YYYY-MM-DD date for the email in Bogota time.
 *
 * @param value Date string in YYYY-MM-DD format.
 * @returns Human readable date in Spanish.
 */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(
    new Date(`${value}T12:00:00-05:00`),
  );
}

/**
 * Builds the QR confirmation email body using the Elite Club palette.
 * Uses table layout and inline styles for email client compatibility.
 * Palette: bg #0B0F15, surface #121824, accent #0085FF, text #F7F9FC, muted #94A3B8.
 *
 * @param data Reservation, service and QR code data.
 * @param qrImages QR codes rendered as data URLs, same order as data.codes.
 * @returns Full HTML document for the email.
 */
function buildQrEmailHtml(data: QrEmailData, qrImages: string[]): string {
  const tickets = data.codes
    .map((code, index) => {
      const image = qrImages[index] ?? "";
      const label = data.codes.length > 1 ? `INVITADO ${index + 1}` : "ACCESO";
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;background:#ffffff;border-radius:12px;">
          <tr>
            <td align="center" style="padding:18px 12px 6px 12px;color:#0085ff;font-size:11px;font-weight:bold;letter-spacing:2px;">ELITE CLUB · ${label}</td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 12px;">
              ${image ? `<img src="${image}" alt="Codigo QR de acceso ${index + 1}" width="180" height="180" style="display:block;width:180px;height:180px;" />` : ""}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 16px 4px 16px;color:#121824;font-size:13px;font-weight:bold;word-break:break-all;">${code}</td>
          </tr>
          <tr>
            <td align="center" style="padding:0 16px 18px 16px;color:#5b6b82;font-size:11px;">${data.date} · ${data.startTime} - ${data.endTime}</td>
          </tr>
        </table>`;
    })
    .join("");

  const minorsRow = data.containsMinors
    ? `
        <tr>
          <td style="padding:10px 16px;color:#f6d580;font-size:12px;line-height:1.6;">
            Regla de menores: cada menor debe ingresar con un adulto responsable (${data.responsibleAdult ?? "registrado en la reserva"}). El personal puede pedir el documento al ingreso.
          </td>
        </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#0b0f15;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f15;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#121824;border:1px solid rgba(255,255,255,0.09);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px 6px 24px;color:#8fcbff;font-size:11px;font-weight:bold;letter-spacing:2px;">ELITE CLUB · RESERVA CONFIRMADA</td>
          </tr>
          <tr>
            <td style="padding:0 24px 4px 24px;color:#f7f9fc;font-size:22px;font-weight:bold;">Hola ${data.customerName}, tu espacio ya es tuyo.</td>
          </tr>
          <tr>
            <td style="padding:6px 24px 14px 24px;color:#94a3b8;font-size:13px;line-height:1.6;">Presenta estos codigos al empleado del servicio el dia de tu reserva. Referencia de pago ${data.reference}.</td>
          </tr>
          <tr>
            <td style="padding:0 24px 6px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
                <tr>
                  <td style="padding:12px 16px;color:#94a3b8;font-size:12px;">Espacio<br /><span style="color:#f7f9fc;font-size:14px;font-weight:bold;">${data.serviceName}</span></td>
                  <td style="padding:12px 16px;color:#94a3b8;font-size:12px;">Fecha<br /><span style="color:#f7f9fc;font-size:14px;font-weight:bold;">${formatDate(data.date)}</span></td>
                </tr>
                <tr>
                  <td style="padding:0 16px 14px 16px;color:#94a3b8;font-size:12px;">Franja horaria<br /><span style="color:#f7f9fc;font-size:14px;font-weight:bold;">${data.startTime} - ${data.endTime}</span></td>
                  <td style="padding:0 16px 14px 16px;color:#94a3b8;font-size:12px;">Codigos<br /><span style="color:#f7f9fc;font-size:14px;font-weight:bold;">${data.codes.length} QR</span></td>
                </tr>
                ${minorsRow}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 6px 24px;color:#f7f9fc;font-size:13px;font-weight:bold;">${data.codes.length > 1 ? "Cada persona presenta su propio codigo." : "Presenta este codigo al llegar."}</td>
          </tr>
          <tr><td style="padding:0 24px 8px 24px;">${tickets}</td></tr>
          <tr>
            <td style="padding:0 24px 22px 24px;color:#748198;font-size:11px;line-height:1.6;">El QR solo es valido en la fecha y turno de tu reserva. Si no ves las imagenes, usa el codigo alfanumerico de cada tarjeta.</td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 24px 24px;">
              <a href="https://eliteclub.example.com/my-reservations" style="display:inline-block;background:linear-gradient(135deg,#0085ff,#0070d8);color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:1px;text-decoration:none;padding:12px 22px;border-radius:10px;">VER MIS RESERVAS</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the QR codes of a paid reservation to the receipt email.
 * Never throws: a delivery failure is logged and reported so the
 * caller never reverts an approved payment because of email.
 *
 * @param reservaId Reservation id whose QR codes were just issued.
 * @returns Email delivery result.
 */
export async function sendReservationQrEmail(reservaId: string): Promise<EmailResult> {
  const row = await getPrisma().reserva.findUnique({
    where: { id: reservaId },
    include: {
      servicio: true,
      cliente: true,
      pagos: { where: { estado: "aprobado" }, orderBy: { fechaPago: "desc" }, take: 1 },
      codigosQr: { orderBy: { codigo: "asc" } },
    },
  });
  if (!row || row.codigosQr.length === 0) {
    console.warn(`[email] No QR codes found for reservation ${reservaId}; skipping email.`);
    return { delivered: false, skipped: true };
  }
  const recipient = row.pagos[0]?.correoComprobante ?? row.cliente.correo;
  const data: QrEmailData = {
    serviceName: row.servicio.nombre,
    date: row.fecha.toISOString().slice(0, 10),
    startTime: row.horaInicio.toISOString().slice(11, 16),
    endTime: row.horaFin.toISOString().slice(11, 16),
    customerName: row.cliente.nombre,
    recipient,
    reference: row.pagos[0]?.referencia ?? "pago aprobado",
    containsMinors: row.contieneMenores,
    responsibleAdult: row.adultoResponsable,
    codes: row.codigosQr.map((qr) => qr.codigo),
  };
  const qrImages = await Promise.all(
    data.codes.map((code) =>
      QRCode.toDataURL(code, {
        width: 360,
        margin: 1,
        color: { dark: "#0B0F15", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      }).catch((error) => {
        console.error(`[email] QR render failed for reservation ${reservaId}:`, error);
        return "";
      }),
    ),
  );
  const subject = `Tus QR de ${data.serviceName} · ${data.date} ${data.startTime}`;
  const html = buildQrEmailHtml(data, qrImages);
  const result = await sendEmail({ to: recipient, subject, html });
  if (!result.delivered) {
    console.error(`[email] QR email for reservation ${reservaId} to ${recipient} was not delivered; payment stays approved for manual retry.`);
  }
  return result;
}
