import { jsPDF } from "jspdf";

export function createQrTicketPdf({ qrDataUrl, ticketLabel, serviceLabel, serviceName, reservationCode, dateTime }: {
  qrDataUrl: string;
  ticketLabel: string;
  serviceLabel: string;
  serviceName: string;
  reservationCode: string;
  dateTime: string;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [90, 140], compress: true });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  const navy = [16, 36, 58] as const;
  const blue = [8, 127, 181] as const;
  const cyan = [39, 181, 232] as const;
  const muted = [96, 113, 134] as const;

  doc.setFillColor(238, 243, 248);
  doc.rect(0, 0, width, height, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 233, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(4, 4, width - 8, height - 8, 4, 4, "FD");

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(4.5, 4.5, width - 9, 21, 3.5, 3.5, "F");
  doc.setFillColor(cyan[0], cyan[1], cyan[2]);
  doc.roundedRect(10, 9, 12, 12, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("E", 16, 17.2, { align: "center" });
  doc.setFontSize(9);
  doc.text("ÉLITE CLUB", 27, 14.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(193, 211, 229);
  doc.text("SPORTS · WELLNESS", 27, 19.5);

  const guestTag = ticketLabel.toLocaleUpperCase();
  const tagWidth = Math.min(width - 24, doc.getTextWidth(guestTag) + 12);
  doc.setFillColor(231, 246, 252);
  doc.roundedRect((width - tagWidth) / 2, 30, tagWidth, 8, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(blue[0], blue[1], blue[2]);
  doc.text(guestTag, width / 2, 35.3, { align: "center", maxWidth: width - 24 });

  const qrSize = 57;
  const qrPosition = (width - qrSize) / 2;
  doc.addImage(qrDataUrl, "PNG", qrPosition, 40, qrSize, qrSize, undefined, "FAST");

  doc.setFillColor(245, 248, 251);
  doc.roundedRect(10, 99, width - 20, 11, 2, 2, "F");
  doc.setFont("courier", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(reservationCode, width / 2, 106, { align: "center", maxWidth: width - 24 });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(11, 114, width - 11, 114);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.3);
  doc.setTextColor(...muted);
  doc.text(serviceLabel.toLocaleUpperCase(), 12, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  const serviceLines = doc.splitTextToSize(serviceName, width - 24).slice(0, 2);
  doc.text(serviceLines, 12, 125.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text(dateTime, 12, 132, { maxWidth: width - 24 });
  doc.setFillColor(cyan[0], cyan[1], cyan[2]);
  doc.roundedRect(width / 2 - 8, 134, 16, 1.5, 0.7, 0.7, "F");
  return doc.output("blob");
}
