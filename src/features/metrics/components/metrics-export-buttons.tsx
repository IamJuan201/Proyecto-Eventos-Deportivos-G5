"use client";

import { useState } from "react";
import type { DashboardMetrics, SalesPeak } from "@/features/metrics/services/metrics.service";

type ExportBooking = {
  id: string; customer: string; service: string; date: string; startTime: string; endTime: string;
  people: number; status: string; subtotal: number; discount: number; total: number;
  paidAmount: number; paidAt: string; createdAt: string;
};

type Props = {
  locale: string;
  labels: {
    xls: string; pdf: string; reportTitle: string; reportSubtitle: string; generatedAt: string;
    summary: string; monthlyRevenue: string; revenueHistory: string; bookingHistory: string;
    period: string; metric: string; value: string; count: string; percentage: string; revenue: string; payments: string;
    approvedIncome: string; paidBookings: string; totalBookings: string; bookedPeople: string; allowedAccesses: string;
    accessReads: string; activeEmployees: string; bookingStatus: string; paid: string; pending: string;
    expired: string; customer: string; service: string; dateAndTime: string; bookingId: string;
    salesPeaks: string; bestDay: string; bestWeek: string; bestMonth: string;
    startTime: string; endTime: string; people: string; status: string; subtotal: string;
    discount: string; paidAmount: string; paidAt: string; createdAt: string;
    total: string; exportError: string; xlsLoading: string; pdfLoading: string;
    noData: string; reportFooter: string;
  };
};
export type MetricsExportLabels = Props["labels"];

function peakDate(peak: SalesPeak | null, locale: string, period: "day" | "week" | "month") {
  if (!peak) return "—";
  const date = new Date(`${peak.start}T12:00:00Z`);
  if (period === "week") {
    const end = new Date(date);
    end.setUTCDate(end.getUTCDate() + 6);
    const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
    const fullFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return `${formatter.format(date)} – ${fullFormatter.format(end)}`;
  }
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", period === "month"
    ? { month: "long", year: "numeric", timeZone: "UTC" }
    : { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function MetricsExportButtons({ locale, labels }: Props) {
  const [xlsxPending, setXlsxPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);

  async function downloadXlsx() {
    setXlsxPending(true);
    try {
      const numberLocale = locale === "en" ? "en-US" : "es-CO";
      const response = await fetch("/api/admin/metrics/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load booking history");
      const { bookings, metrics } = await response.json() as { bookings: ExportBooking[]; metrics: DashboardMetrics };
      const statusRows = [
        { label: labels.paid, value: metrics.bookingStates.paid },
        { label: labels.pending, value: metrics.bookingStates.pending },
        { label: labels.expired, value: metrics.bookingStates.expired },
      ];
      const statusTotal = statusRows.reduce((total, row) => total + row.value, 0);
      const [workbookApi, worksheetApi, styleApi, chartApi, drawingApi, ioApi] = await Promise.all([
        import("@office-kit/xlsx/workbook"), import("@office-kit/xlsx/worksheet"),
        import("@office-kit/xlsx/styles"), import("@office-kit/xlsx/chart"),
        import("@office-kit/xlsx/drawing"), import("@office-kit/xlsx/io"),
      ]);
      const wb = workbookApi.createWorkbook();
      const dashboard = workbookApi.addWorksheet(wb, labels.summary.slice(0, 31));
      const revenueSheet = workbookApi.addWorksheet(wb, labels.revenueHistory.slice(0, 31));
      const bookingsSheet = workbookApi.addWorksheet(wb, labels.bookingHistory.slice(0, 31));
      const navy = "FF10243A", blue = "FF087FB5", cyan = "FF27B5E8", pale = "FFEAF5FB", slate = "FF526579", white = "FFFFFFFF";
      const titleStyle = styleApi.registerCellStyle(wb, { font: { name: "Aptos Display", size: 20, bold: true, color: { rgb: white } }, fill: { kind: "pattern", patternType: "solid", fgColor: { rgb: navy } }, alignment: { vertical: "center" } });
      const subtitleStyle = styleApi.registerCellStyle(wb, { font: { name: "Aptos", size: 10, color: { rgb: slate }, italic: true } });
      const headerStyle = styleApi.registerCellStyle(wb, { font: { name: "Aptos", size: 10, bold: true, color: { rgb: white } }, fill: { kind: "pattern", patternType: "solid", fgColor: { rgb: blue } }, alignment: { vertical: "center", horizontal: "center", wrapText: true } });
      const kpiNameStyle = styleApi.registerCellStyle(wb, { font: { name: "Aptos", size: 10, bold: true, color: { rgb: slate } }, fill: { kind: "pattern", patternType: "solid", fgColor: { rgb: pale } } });
      const moneyStyle = styleApi.registerCellStyle(wb, { numberFormat: '"COP" #,##0;[Red]("COP" #,##0);–', alignment: { horizontal: "right" } });
      const integerStyle = styleApi.registerCellStyle(wb, { numberFormat: "#,##0", alignment: { horizontal: "right" } });
      const dateStyle = styleApi.registerCellStyle(wb, { numberFormat: locale === "en" ? "mmm d, yyyy" : "dd/mm/yyyy", alignment: { horizontal: "left" } });
      const dateTimeStyle = styleApi.registerCellStyle(wb, { numberFormat: locale === "en" ? "mmm d, yyyy hh:mm" : "dd/mm/yyyy hh:mm", alignment: { horizontal: "left" } });
      const percentStyle = styleApi.registerCellStyle(wb, { numberFormat: "0.0%", alignment: { horizontal: "right" } });
      const bodyStyle = styleApi.registerCellStyle(wb, { font: { name: "Aptos", size: 10, color: { rgb: "FF1E293B" } }, alignment: { vertical: "center" } });
      const write = (sheet: typeof dashboard, row: number, values: (string | number | Date | null)[], styles: (number | undefined)[] = []) => values.forEach((value, index) => worksheetApi.setCell(sheet, row, index + 1, value, styles[index]));
      const table = (sheet: typeof dashboard, name: string, ref: string, headers: string[]) => worksheetApi.addExcelTable(wb, sheet, { name, ref, columns: headers, style: "TableStyleMedium2" });
      const quoteSheet = (name: string) => `'${name.replaceAll("'", "''")}'`;
      const revenueName = revenueSheet.title;
      const dashboardName = dashboard.title;
      const numberFormat = '#,##0;[Red](#,##0);–';
      const revenueHeaders = [labels.period, labels.revenue, labels.payments];
      write(revenueSheet, 1, revenueHeaders, revenueHeaders.map(() => headerStyle));
      const revenueRows = metrics.revenueHistory.map((point) => [new Date(`${point.month}-01T12:00:00Z`), point.revenue, point.payments] as [Date, number, number]);
      revenueRows.forEach((row, index) => write(revenueSheet, index + 2, row, [bodyStyle, moneyStyle, integerStyle]));
      if (revenueRows.length) table(revenueSheet, "RevenueHistory", `A1:C${revenueRows.length + 1}`, revenueHeaders);
      worksheetApi.setColumnWidths(revenueSheet, [20, 22, 16]);
      worksheetApi.setFreezePanes(revenueSheet, { rows: 1, cols: 0 });
      // Month values stay true Excel dates; display only the month and year.
      const monthStyle = styleApi.registerCellStyle(wb, { numberFormat: locale === "en" ? "mmm yyyy" : "mmm yyyy", alignment: { horizontal: "left" } });
      revenueRows.forEach((_, index) => worksheetApi.setCell(revenueSheet, index + 2, 1, revenueRows[index][0], monthStyle));

      const bookingHeaders = [labels.bookingId, labels.customer, labels.service, labels.dateAndTime, labels.startTime, labels.endTime, labels.people, labels.status, labels.subtotal, labels.discount, labels.total, labels.paidAmount, labels.paidAt, labels.createdAt];
      write(bookingsSheet, 1, bookingHeaders, bookingHeaders.map(() => headerStyle));
      const statusLabel = (status: string) => status === "pagada" ? labels.paid : status === "pendiente_pago" ? labels.pending : labels.expired;
      const bookingRows = bookings.map((booking) => [booking.id, booking.customer, booking.service, new Date(`${booking.date}T12:00:00Z`), booking.startTime, booking.endTime, booking.people, statusLabel(booking.status), booking.subtotal, booking.discount, booking.total, booking.paidAmount, booking.paidAt ? new Date(booking.paidAt) : "", new Date(booking.createdAt)]);
      bookingRows.forEach((row, index) => write(bookingsSheet, index + 2, row, [bodyStyle, bodyStyle, bodyStyle, dateStyle, bodyStyle, bodyStyle, integerStyle, bodyStyle, moneyStyle, moneyStyle, moneyStyle, moneyStyle, dateTimeStyle, dateTimeStyle]));
      if (bookingRows.length) table(bookingsSheet, "BookingHistory", `A1:N${bookingRows.length + 1}`, bookingHeaders);
      worksheetApi.setColumnWidths(bookingsSheet, [38, 30, 26, 18, 13, 13, 12, 22, 18, 18, 18, 18, 22, 22]);
      worksheetApi.setFreezePanes(bookingsSheet, { rows: 1, cols: 2 });

      const title = labels.reportTitle;
      worksheetApi.mergeCells(dashboard, "A1:F1");
      worksheetApi.setCell(dashboard, 1, 1, title, titleStyle);
      worksheetApi.setRowHeight(dashboard, 1, 34);
      worksheetApi.mergeCells(dashboard, "A2:F2");
      worksheetApi.setCell(dashboard, 2, 1, `${labels.reportSubtitle} · ${labels.generatedAt}: ${new Date().toLocaleString(numberLocale)}`, subtitleStyle);
      const kpis: [string, number, number][] = [
        [labels.approvedIncome, metrics.approvedIncome, moneyStyle], [labels.paidBookings, metrics.paidBookings, integerStyle],
        [labels.totalBookings, bookings.length, integerStyle], [labels.bookedPeople, metrics.bookedPeople, integerStyle],
        [labels.allowedAccesses, metrics.allowedAccesses, integerStyle], [labels.activeEmployees, metrics.activeEmployees, integerStyle],
      ];
      write(dashboard, 4, [labels.metric, labels.value], [headerStyle, headerStyle]);
      kpis.forEach(([name, value, style], index) => write(dashboard, index + 5, [name, value], [kpiNameStyle, style]));
      table(dashboard, "BusinessKPIs", "A4:B10", [labels.metric, labels.value]);
      [labels.bookingStatus, labels.count, labels.percentage].forEach((value, index) => worksheetApi.setCell(dashboard, 4, index + 3, value, headerStyle));
      statusRows.forEach((row, index) => [row.label, row.value, statusTotal ? row.value / statusTotal : 0].forEach((value, column) => worksheetApi.setCell(dashboard, index + 5, column + 3, value, [bodyStyle, integerStyle, percentStyle][column])));
      table(dashboard, "BookingStatus", "C4:E7", [labels.bookingStatus, labels.count, labels.percentage]);
      write(dashboard, 13, [labels.salesPeaks, labels.period, labels.revenue, labels.payments], [headerStyle, headerStyle, headerStyle, headerStyle]);
      const peaks = [[labels.bestDay, peakDate(metrics.salesPeaks.day, locale, "day"), metrics.salesPeaks.day], [labels.bestWeek, peakDate(metrics.salesPeaks.week, locale, "week"), metrics.salesPeaks.week], [labels.bestMonth, peakDate(metrics.salesPeaks.month, locale, "month"), metrics.salesPeaks.month]] as const;
      peaks.forEach(([label, period, peak], index) => write(dashboard, index + 14, [label, period, peak?.total ?? 0, peak?.payments ?? 0], [bodyStyle, bodyStyle, moneyStyle, integerStyle]));
      table(dashboard, "SalesPeaks", "A13:D16", [labels.salesPeaks, labels.period, labels.revenue, labels.payments]);
      worksheetApi.setColumnWidths(dashboard, [28, 23, 29, 16, 16, 4, 18, 18, 18, 18]);
      worksheetApi.setFreezePanes(dashboard, { rows: 3, cols: 0 });

      if (revenueRows.length) {
        const endRow = revenueRows.length + 1;
        const excelDates = (rows: typeof revenueRows) => rows.map((row) => Math.round(row[0].getTime() / 86_400_000) + 25_569);
        const series = chartApi.makeBarSeries({ idx: 0, tx: { kind: "literal", value: labels.revenue }, cat: { ref: `${quoteSheet(revenueName)}!$A$2:$A$${endRow}`, cacheKind: "num", cache: excelDates(revenueRows), formatCode: "mmm yyyy" }, val: { ref: `${quoteSheet(revenueName)}!$B$2:$B$${endRow}`, cache: revenueRows.map((row) => row[1]), formatCode: numberFormat } });
        drawingApi.addChartAt(dashboard, "G3", { space: chartApi.makeChartSpace({ title: labels.revenueHistory, legend: { position: "b" }, plotArea: { chart: chartApi.makeLineChart({ grouping: "standard", series: [series] }) }, style: 13 }) }, { widthPx: 680, heightPx: 330 });
        const firstRecent = Math.max(2, endRow - 5);
        const recentSeries = chartApi.makeBarSeries({ idx: 0, tx: { kind: "literal", value: labels.revenue }, cat: { ref: `${quoteSheet(revenueName)}!$A$${firstRecent}:$A$${endRow}`, cacheKind: "num", cache: excelDates(revenueRows.slice(-6)), formatCode: "mmm yyyy" }, val: { ref: `${quoteSheet(revenueName)}!$B$${firstRecent}:$B$${endRow}`, cache: revenueRows.slice(-6).map((row) => row[1]), formatCode: numberFormat } });
        drawingApi.addChartAt(dashboard, "G21", { space: chartApi.makeChartSpace({ title: labels.monthlyRevenue, legend: { position: "b" }, plotArea: { chart: chartApi.makeBarChart({ barDir: "col", grouping: "clustered", series: [recentSeries] }) }, style: 13 }) }, { widthPx: 680, heightPx: 330 });
      }
      const statusSeries = chartApi.makeBarSeries({ idx: 0, tx: { kind: "literal", value: labels.bookingStatus }, cat: { ref: `${quoteSheet(dashboardName)}!$C$5:$C$7`, cacheKind: "str", cache: statusRows.map((row) => row.label) }, val: { ref: `${quoteSheet(dashboardName)}!$D$5:$D$7`, cache: statusRows.map((row) => row.value), formatCode: numberFormat } });
      drawingApi.addChartAt(dashboard, "A19", { space: chartApi.makeChartSpace({ title: labels.bookingStatus, legend: { position: "r" }, plotArea: { chart: chartApi.makePieChart({ series: [statusSeries], varyColors: true }) }, style: 10 }) }, { widthPx: 460, heightPx: 330 });

      const bytes = await ioApi.workbookToBytes(wb);
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `elite-club-${locale === "en" ? "metrics" : "metricas"}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Could not create the Excel metrics report", error);
      window.alert(labels.exportError);
    } finally {
      setXlsxPending(false);
    }
  }

  async function downloadPdf() {
    setPdfPending(true);
    try {
      const response = await fetch("/api/admin/metrics/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load current metrics");
      const { bookings, metrics } = await response.json() as { bookings: ExportBooking[]; metrics: DashboardMetrics };
      const { createMetricsPdf } = await import("./metrics-export-pdf");
      const blob = createMetricsPdf({ metrics, bookings, locale, labels });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `elite-club-${locale === "en" ? "metrics" : "metricas"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Could not create the PDF metrics report", error);
      window.alert(labels.exportError);
    } finally {
      setPdfPending(false);
    }
  }

  return (
    <div className="metrics-export-actions">
      <button className="club-button metrics-export-button" type="button" onClick={downloadXlsx} disabled={xlsxPending || pdfPending}>{xlsxPending ? labels.xlsLoading : labels.xls}</button>
      <button className="club-button club-button-secondary metrics-export-button" type="button" onClick={downloadPdf} disabled={pdfPending || xlsxPending}>{pdfPending ? labels.pdfLoading : labels.pdf}</button>
    </div>
  );
}
