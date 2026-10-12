import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardMetrics } from "@/features/metrics/services/metrics.service";
import type { MetricsExportLabels } from "./metrics-export-buttons";

type Booking = {
  id: string; customer: string; service: string; date: string; startTime: string; endTime: string;
  people: number; status: string; subtotal: number; discount: number; total: number; paidAmount: number;
};

const colors = {
  navy: [16, 36, 58] as const,
  blue: [8, 127, 181] as const,
  cyan: [39, 181, 232] as const,
  ink: [30, 41, 59] as const,
  muted: [100, 116, 139] as const,
  grid: [220, 228, 236] as const,
  pale: [240, 247, 251] as const,
  status: [[16, 185, 129], [245, 158, 11], [239, 95, 95]] as const,
};

export function createMetricsPdf({
  metrics, bookings, locale, labels,
}: { metrics: DashboardMetrics; bookings: Booking[]; locale: string; labels: MetricsExportLabels }) {
  const language = locale === "en" ? "en-US" : "es-CO";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const money = (amount: number) => `COP ${new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(amount)}`;
  const number = (amount: number) => new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(amount);
  const month = (value: string) => new Intl.DateTimeFormat(language, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`));
  const generatedAt = new Intl.DateTimeFormat(language, { dateStyle: "long", timeStyle: "short" }).format(new Date());
  const statusRows = [
    { label: labels.paid, value: metrics.bookingStates.paid },
    { label: labels.pending, value: metrics.bookingStates.pending },
    { label: labels.expired, value: metrics.bookingStates.expired },
  ];
  const statusTotal = statusRows.reduce((sum, row) => sum + row.value, 0);

  function header(title: string, subtitle: string, pageLabel: string) {
    doc.setFillColor(...colors.navy);
    doc.rect(0, 0, pageWidth, 31, "F");
    doc.setFillColor(...colors.cyan);
    doc.rect(0, 30, pageWidth, 1.4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`ELITE CLUB  /  ${pageLabel.toLocaleUpperCase(language)}`, 14, 10);
    doc.setFontSize(19);
    doc.text(title, 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(218, 229, 239);
    doc.text(subtitle, 14, 26);
    doc.setTextColor(...colors.muted);
    doc.setFontSize(8);
    doc.text(`${labels.generatedAt}: ${generatedAt}`, pageWidth - 14, 10, { align: "right" });
  }

  function sectionTitle(title: string, x: number, y: number, hint?: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.ink);
    doc.text(title, x, y);
    if (hint) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(hint, x, y + 5);
    }
  }

  function lineChart(x: number, y: number, width: number, height: number) {
    const rows = metrics.revenueHistory;
    if (!rows.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.muted);
      doc.text(labels.noData, x + width / 2, y + height / 2, { align: "center" });
      return;
    }
    const left = x + 20;
    const right = x + width - 3;
    const top = y + 4;
    const bottom = y + height - 16;
    const maxValue = Math.max(1, ...rows.map((row) => row.revenue));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    for (let step = 0; step <= 4; step += 1) {
      const amount = (maxValue * step) / 4;
      const gridY = bottom - (step / 4) * (bottom - top);
      doc.setDrawColor(...colors.grid);
      doc.setLineWidth(0.25);
      doc.line(left, gridY, right, gridY);
      doc.setTextColor(...colors.muted);
      doc.text(money(amount), left - 2, gridY + 1, { align: "right" });
    }
    const points = rows.map((row, index) => ({
      x: left + (index * (right - left)) / Math.max(1, rows.length - 1),
      y: bottom - (row.revenue / maxValue) * (bottom - top),
      ...row,
    }));
    doc.setDrawColor(...colors.blue);
    doc.setLineWidth(0.9);
    for (let index = 1; index < points.length; index += 1) {
      doc.line(points[index - 1].x, points[index - 1].y, points[index].x, points[index].y);
    }
    const labelInterval = Math.max(1, Math.ceil(points.length / 10));
    points.forEach((point, index) => {
      doc.setFillColor(...colors.cyan);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(point.x, point.y, 1.5, "FD");
      if (index % labelInterval === 0 || index === points.length - 1) {
        doc.setFontSize(7);
        doc.setTextColor(...colors.muted);
        doc.text(month(point.month), point.x, bottom + 7, { align: "center" });
      }
    });
  }

  function barChart(x: number, y: number, width: number, height: number) {
    const rows = metrics.revenueTrend.slice(-6);
    if (!rows.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(labels.noData, x + width / 2, y + height / 2, { align: "center" });
      return;
    }
    const maxValue = Math.max(1, ...rows.map((row) => row.revenue));
    const gap = 5;
    const barWidth = Math.min(15, (width - (rows.length - 1) * gap) / rows.length);
    const usedWidth = rows.length * barWidth + (rows.length - 1) * gap;
    const startX = x + (width - usedWidth) / 2;
    const baseline = y + height - 17;
    const maxHeight = height - 34;
    rows.forEach((row, index) => {
      const barHeight = row.revenue ? Math.max(1, (row.revenue / maxValue) * maxHeight) : 0.8;
      const bx = startX + index * (barWidth + gap);
      doc.setFillColor(...colors.pale);
      doc.roundedRect(bx, baseline - maxHeight, barWidth, maxHeight, 1.5, 1.5, "F");
      doc.setFillColor(...colors.blue);
      doc.roundedRect(bx, baseline - barHeight, barWidth, barHeight, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.ink);
      doc.text(money(row.revenue), bx + barWidth / 2, baseline - maxHeight - 3, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.text(month(row.month), bx + barWidth / 2, baseline + 6, { align: "center" });
      doc.text(`${number(row.payments)} ${labels.payments.toLocaleLowerCase(language)}`, bx + barWidth / 2, baseline + 11, { align: "center" });
    });
  }

  function pieChart(cx: number, cy: number, radius: number) {
    if (!statusTotal) {
      doc.setDrawColor(...colors.grid);
      doc.setFillColor(238, 243, 247);
      doc.circle(cx, cy, radius, "FD");
      return;
    }
    let angle = -90;
    statusRows.forEach((row, rowIndex) => {
      const sweep = (row.value / statusTotal) * 360;
      const segments = Math.max(1, Math.ceil(sweep / 5));
      for (let segment = 0; segment < segments; segment += 1) {
        const start = angle + (sweep * segment) / segments;
        const end = angle + (sweep * (segment + 1)) / segments;
        const point = (degrees: number) => ({ x: cx + radius * Math.cos((degrees * Math.PI) / 180), y: cy + radius * Math.sin((degrees * Math.PI) / 180) });
        const from = point(start);
        const to = point(end);
        const color = colors.status[rowIndex];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.15);
        doc.triangle(cx, cy, from.x, from.y, to.x, to.y, "FD");
      }
      angle += sweep;
    });
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.circle(cx, cy, radius, "S");
  }

  // Page 1: executive summary and full historical revenue trend.
  header(labels.reportTitle, labels.reportSubtitle, labels.summary);
  sectionTitle(labels.summary, 14, 41, `${labels.totalBookings}: ${number(bookings.length)}`);
  const kpis = [
    [labels.approvedIncome, money(metrics.approvedIncome)],
    [labels.paidBookings, number(metrics.paidBookings)],
    [labels.bookedPeople, number(metrics.bookedPeople)],
    [labels.allowedAccesses, number(metrics.allowedAccesses)],
    [labels.accessReads, number(metrics.accessReads)],
    [labels.activeEmployees, number(metrics.activeEmployees)],
  ];
  const cardGap = 6;
  const cardWidth = (pageWidth - 28 - cardGap * 2) / 3;
  kpis.forEach(([name, value], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 14 + column * (cardWidth + cardGap);
    const y = 49 + row * 23;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.grid);
    doc.roundedRect(x, y, cardWidth, 19, 2, 2, "FD");
    doc.setFillColor(...colors.cyan);
    doc.roundedRect(x, y, 1.5, 19, 0.7, 0.7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.muted);
    doc.text(name.toLocaleUpperCase(language), x + 5, y + 7);
    doc.setFontSize(13);
    doc.setTextColor(...colors.navy);
    doc.text(value, x + 5, y + 15);
  });
  sectionTitle(labels.revenueHistory, 14, 103, labels.reportSubtitle);
  lineChart(14, 111, pageWidth - 28, 77);

  // Page 2: recent monthly revenue, booking mix, and best sales periods.
  doc.addPage();
  sectionTitle(labels.monthlyRevenue, 14, 43, labels.revenue);
  barChart(14, 51, 132, 79);
  sectionTitle(labels.bookingStatus, 158, 43, `${number(statusTotal)} ${labels.totalBookings.toLocaleLowerCase(language)}`);
  pieChart(184, 91, 27);
  statusRows.forEach((row, index) => {
    const y = 69 + index * 18;
    const color = colors.status[index];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(224, y, 1.8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.ink);
    doc.text(row.label, 230, y + 1);
    doc.setFont("helvetica", "bold");
    doc.text(`${number(row.value)} · ${statusTotal ? ((row.value / statusTotal) * 100).toFixed(1) : "0.0"}%`, pageWidth - 14, y + 1, { align: "right" });
  });
  sectionTitle(labels.salesPeaks, 14, 145);
  const periods = [
    [labels.bestDay, metrics.salesPeaks.day ? metrics.salesPeaks.day.start : "—", metrics.salesPeaks.day?.total ?? 0, metrics.salesPeaks.day?.payments ?? 0],
    [labels.bestWeek, metrics.salesPeaks.week ? metrics.salesPeaks.week.start : "—", metrics.salesPeaks.week?.total ?? 0, metrics.salesPeaks.week?.payments ?? 0],
    [labels.bestMonth, metrics.salesPeaks.month ? month(metrics.salesPeaks.month.start.slice(0, 7)) : "—", metrics.salesPeaks.month?.total ?? 0, metrics.salesPeaks.month?.payments ?? 0],
  ];
  autoTable(doc, {
    startY: 151,
    head: [[labels.metric, labels.period, labels.revenue, labels.payments]],
    body: periods.map(([name, period, amount, payments]) => [name, period, money(Number(amount)), number(Number(payments))]),
    theme: "striped",
    margin: { left: 14, right: 14 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: [...colors.ink] },
    headStyles: { fillColor: [...colors.navy], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [...colors.pale] },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // Page 3+: full, current reservation ledger from the protected export API.
  doc.addPage();
  const statusLabel = (status: string) => status === "pagada" ? labels.paid : status === "pendiente_pago" ? labels.pending : labels.expired;
  autoTable(doc, {
    startY: 39,
    head: [[labels.bookingId, labels.customer, labels.service, labels.dateAndTime, labels.status, labels.people, labels.total, labels.paidAmount]],
    body: bookings.map((booking) => [booking.id, booking.customer, booking.service, `${booking.date}\n${booking.startTime}–${booking.endTime}`, statusLabel(booking.status), number(booking.people), money(booking.total), money(booking.paidAmount)]),
    theme: "striped",
    margin: { top: 39, right: 10, bottom: 15, left: 10 },
    styles: { font: "helvetica", fontSize: 6.5, cellPadding: 2, overflow: "linebreak", textColor: [...colors.ink], valign: "middle" },
    headStyles: { fillColor: [...colors.navy], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [...colors.pale] },
    columnStyles: { 0: { fontSize: 6 }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
    showHead: "everyPage",
  });

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...colors.grid);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.text("Elite Club · " + labels.reportTitle, 14, pageHeight - 4);
    doc.text(`${page} / ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 4, { align: "right" });
  }

  for (let page = 2; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    const title = page === 2 ? labels.reportTitle : labels.bookingHistory;
    const subtitle = page === 2
      ? labels.reportSubtitle
      : `${labels.totalBookings}: ${number(bookings.length)} · ${labels.reportFooter}`;
    const pageLabel = page === 2 ? labels.monthlyRevenue : labels.bookingHistory;
    if (page === 2) {
      doc.setFillColor(16, 36, 58);
      doc.rect(0, 0, pageWidth, 31, "F");
      doc.setFillColor(39, 181, 232);
      doc.rect(0, 30, pageWidth, 1.4, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(16, 36, 58);
      doc.setDrawColor(39, 181, 232);
      doc.setLineWidth(1);
      doc.line(14, 31, pageWidth - 14, 31);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`ELITE CLUB  /  ${pageLabel.toLocaleUpperCase(language)}`, 14, 10);
    doc.setFontSize(19);
    doc.text(title, 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(page === 2 ? 218 : 100, page === 2 ? 229 : 116, page === 2 ? 239 : 139);
    doc.text(subtitle, 14, 26);
    doc.setTextColor(...colors.muted);
    doc.setFontSize(8);
    doc.text(`${labels.generatedAt}: ${generatedAt}`, pageWidth - 14, 10, { align: "right" });
  }

  return doc.output("blob");
}
