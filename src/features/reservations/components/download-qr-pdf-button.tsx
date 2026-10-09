"use client";

import { useState } from "react";

type Props = {
  qrDataUrl: string;
  ticketLabel: string;
  serviceLabel: string;
  serviceName: string;
  reservationCode: string;
  dateTime: string;
  fileName: string;
  buttonLabel: string;
  pendingLabel: string;
  errorLabel: string;
};

export function DownloadQrPdfButton({ qrDataUrl, ticketLabel, serviceLabel, serviceName, reservationCode, dateTime, fileName, buttonLabel, pendingLabel, errorLabel }: Props) {
  const [pending, setPending] = useState(false);

  async function downloadPdf() {
    setPending(true);
    try {
      const { createQrTicketPdf } = await import("./qr-ticket-pdf");
      const pdf = createQrTicketPdf({ qrDataUrl, ticketLabel, serviceLabel, serviceName, reservationCode, dateTime });
      const url = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Could not create the reservation QR PDF", error);
      window.alert(errorLabel);
    } finally {
      setPending(false);
    }
  }

  return <button className="qr-download-button" type="button" onClick={downloadPdf} disabled={pending}>{pending ? pendingLabel : buttonLabel}</button>;
}
