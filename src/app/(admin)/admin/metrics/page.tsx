import Link from "next/link";
import { AdminTabs } from "@/shared/components/admin-tabs";
import { getDashboardMetrics, type SalesPeak } from "@/features/metrics/services/metrics.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";
import { MetricsExportButtons } from "@/features/metrics/components/metrics-export-buttons";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { ...options, timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
const weekLabel = (monday: string, locale: string) => {
  const sunday = new Date(monday + "T00:00:00Z");
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return dateLabel(monday, { day: "numeric", month: "short" }, locale) + " – " + dateLabel(sunday.toISOString().slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale);
};
const peakDetail = (peak: SalesPeak) => money(peak.total) + " · " + peak.payments + (peak.payments === 1 ? " pago" : " pagos");
const compactValue = (value: number, locale: string) => {
  const units = [{ threshold: 1_000_000_000, suffix: locale === "en" ? "B" : " mil M" }, { threshold: 1_000_000, suffix: " M" }, { threshold: 1_000, suffix: " mil" }];
  const unit = units.find(({ threshold }) => Math.abs(value) >= threshold);
  if (!unit) return String(Math.round(value));
  const compact = Math.round((value / unit.threshold) * 10) / 10;
  return `${String(compact).replace(".", locale === "en" ? "." : ",")}${unit.suffix}`;
};
const compactMoney = (value: number, locale: string) => `COP ${compactValue(value, locale)}`;
const monthLabel = (month: string, locale: string) => {
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const months = locale === "en"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${months[monthIndex]}${locale === "en" ? "" : "."}`;
};
const monthYearLabel = (month: string, locale: string) => `${monthLabel(month, locale)} ${month.slice(0, 4)}`;

function pieSlicePath(startAngle: number, endAngle: number, radius = 72) {
  const center = 90;
  if (endAngle - startAngle >= 359.99) return `M ${center} ${center} m 0 -${radius} a ${radius} ${radius} 0 1 0 0 ${radius * 2} a ${radius} ${radius} 0 1 0 0 -${radius * 2} Z`;
  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return [center + radius * Math.cos(radians), center + radius * Math.sin(radians)];
  };
  const [startX, startY] = point(startAngle);
  const [endX, endY] = point(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

export default async function MetricsPage() {
  const [metrics, locale] = await Promise.all([getDashboardMetrics(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const cards = [
    { label: "Ingresos aprobados", value: money(metrics.approvedIncome), detail: "Pagos aprobados acumulados" },
    { label: "Reservas pagadas", value: String(metrics.paidBookings), detail: metrics.bookedPeople + " personas reservadas" },
    { label: "Accesos permitidos", value: String(metrics.allowedAccesses), detail: metrics.accessReads + " lecturas registradas" },
    { label: "Empleados activos", value: String(metrics.activeEmployees), detail: "Asignados a un servicio" },
  ];
  const { day, week, month } = metrics.salesPeaks;
  const maxTrendRevenue = Math.max(0, ...metrics.revenueTrend.map((point) => point.revenue));
  const maxHistoryRevenue = Math.max(0, ...metrics.revenueHistory.map((point) => point.revenue));
  const lineChartWidth = 760;
  const monthLabelInterval = Math.max(1, Math.ceil(metrics.revenueHistory.length / 8));
  const chart = { left: 76, right: lineChartWidth - 40, top: 24, bottom: 208 };
  const revenuePoints = metrics.revenueHistory.map((point, index) => ({
    ...point,
    x: chart.left + (index * (chart.right - chart.left)) / Math.max(1, metrics.revenueHistory.length - 1),
    y: chart.bottom - (point.revenue / (maxHistoryRevenue || 1)) * (chart.bottom - chart.top),
  }));
  const revenuePath = revenuePoints.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const bookingStatusRows = [
    { label: "Pagadas", value: metrics.bookingStates.paid, className: "paid", color: "#34d399" },
    { label: "Pendiente de pago", value: metrics.bookingStates.pending, className: "pending", color: "#fbbf24" },
    { label: "Expiradas", value: metrics.bookingStates.expired, className: "expired", color: "#f87171" },
  ];
  const totalBookings = metrics.bookingStates.paid + metrics.bookingStates.pending + metrics.bookingStates.expired;
  let pieAngle = -90;
  const pieSlices = bookingStatusRows.map((row) => {
    const percent = totalBookings ? (row.value / totalBookings) * 100 : 0;
    const startAngle = pieAngle;
    pieAngle += percent * 3.6;
    const midAngle = (startAngle + pieAngle) / 2;
    const labelRadius = 46;
    const labelX = 90 + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const labelY = 90 + labelRadius * Math.sin((midAngle * Math.PI) / 180);
    return { ...row, percent, path: row.value ? pieSlicePath(startAngle, pieAngle) : "", labelX, labelY };
  });
  const peaks = [
    { label: "Día con más ventas", value: day ? dateLabel(day.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" }, locale) : "—", detail: day ? peakDetail(day) : "Sin pagos aprobados" },
    { label: "Semana con más ventas", value: week ? weekLabel(week.start, locale) : "—", detail: week ? peakDetail(week) : "Sin pagos aprobados" },
    { label: "Mes con más ventas", value: month ? dateLabel(month.start, { month: "long", year: "numeric" }, locale) : "—", detail: month ? peakDetail(month) : "Sin pagos aprobados" },
  ];
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("PANEL DE OPERACIÓN")}</span><h1>{t("El club, en cifras.")}</h1><p>{t("Las métricas se calculan con las reservas, pagos y accesos registrados en la base de datos.")}</p></section>
      <AdminTabs active="/admin/metrics" />
      <MetricsExportButtons locale={locale} labels={{ xls: t("Descargar XLS"), pdf: t("Descargar PDF"), reportTitle: t("Reporte de métricas"), reportSubtitle: t("Resumen de ingresos, reservas y accesos basado en los datos registrados."), generatedAt: t("Fecha de generación"), summary: t("Resumen"), monthlyRevenue: t("Ingresos por mes"), revenueHistory: t("Histórico de ingresos"), bookingHistory: t("Historial de reservas"), period: t("Periodo"), metric: t("Indicador"), value: t("Valor"), count: t("Cantidad"), percentage: t("Porcentaje"), revenue: t("Ingresos (COP)"), payments: t("Pagos"), approvedIncome: t("Ingresos aprobados (COP)"), paidBookings: t("Reservas pagadas"), totalBookings: t("Total de reservas"), bookedPeople: t("Personas reservadas"), allowedAccesses: t("Accesos permitidos"), accessReads: t("Lecturas registradas"), activeEmployees: t("Empleados activos"), bookingStatus: t("Reservas por estado"), paid: t("Pagadas"), pending: t("Pendiente de pago"), expired: t("Expiradas"), customer: t("Cliente"), service: t("Servicio"), dateAndTime: t("Fecha y hora"), bookingId: t("ID de reserva"), salesPeaks: t("Periodos de mayores ingresos"), bestDay: t("Día con más ventas"), bestWeek: t("Semana con más ventas"), bestMonth: t("Mes con más ventas"), noData: t("No hay datos registrados para este periodo."), reportFooter: t("Reporte generado desde las métricas actuales del panel de administración."), startTime: t("Hora de inicio"), endTime: t("Hora de fin"), people: t("Personas"), status: t("Estado"), subtotal: t("Subtotal (COP)"), discount: t("Descuento (COP)"), paidAmount: t("Total pagado (COP)"), paidAt: t("Fecha de pago"), createdAt: t("Fecha de creación"), total: t("Total (COP)"), xlsLoading: t("Preparando XLS…"), pdfLoading: t("Preparando PDF…"), exportError: t("No se pudo generar el archivo. Inténtalo de nuevo.") }} />
      <section className="metrics-grid">{cards.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="metrics-grid" style={{ marginTop: 11 }} aria-label="Periodos con más ventas">{peaks.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{cards.length + index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="admin-dashboard-charts" aria-label={t("Resumen visual de operación")}>
        <article className="glass-panel admin-chart-panel">
          <div className="admin-list-heading"><div><h2>{t("Ingresos por mes")}</h2><p>{t("Pagos aprobados · últimos 6 meses")}</p></div><span className="chart-legend"><i />{t("Ingresos")}</span></div>
          {metrics.revenueTrend.length ? <div className="revenue-chart" role="img" aria-label={t("Ingresos mensuales de los últimos seis meses")}>
            {metrics.revenueTrend.map((point) => {
              const height = maxTrendRevenue ? Math.max(point.revenue ? 8 : 2, (point.revenue / maxTrendRevenue) * 100) : 2;
              return <div className="revenue-chart-column" key={point.month}>
                <span className="revenue-chart-value">{compactMoney(point.revenue, locale)}</span>
                <div className="revenue-chart-track"><span style={{ height: `${height}%` }} /></div>
                <strong>{monthLabel(point.month, locale)}</strong><small>{point.payments} {t("pagos")}</small>
              </div>;
            })}
          </div> : <p className="chart-empty">{t("Todavía no hay pagos aprobados para graficar.")}</p>}
        </article>
        <article className="glass-panel admin-chart-panel">
          <div className="admin-list-heading"><div><h2>{t("Tendencia de ingresos")}</h2><p>{t("Histórico completo de pagos aprobados")}</p></div><span className="chart-legend"><i />{t("Ingresos")}</span></div>
          {metrics.revenueHistory.length ? <div className="revenue-line-chart-scroll"><svg className="revenue-line-chart" viewBox={`0 0 ${lineChartWidth} 280`} role="img" aria-label={t("Histórico completo de pagos aprobados")}>
            <defs><linearGradient id="revenue-area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".28" /><stop offset="100%" stopColor="#0284c7" stopOpacity="0" /></linearGradient></defs>
            {Array.from({ length: 5 }, (_, index) => {
              const y = chart.bottom - (index * (chart.bottom - chart.top)) / 4;
              const value = (maxHistoryRevenue * index) / 4;
              return <g key={index}><line className="chart-grid-line" x1={chart.left} y1={y} x2={chart.right} y2={y} /><text className="chart-axis-label" x={chart.left - 10} y={y + 4} textAnchor="end">{compactValue(value, locale)}</text></g>;
            })}
            {revenuePoints.length > 1 && <path className="revenue-line-area" d={`${revenuePath} L ${chart.right} ${chart.bottom} L ${chart.left} ${chart.bottom} Z`} />}
            <path className="revenue-line-path" d={revenuePath} />
            {revenuePoints.map((point, index) => <g key={point.month}>
              <circle className="revenue-line-point" cx={point.x} cy={point.y} r="5" />
              {(index % monthLabelInterval === 0 || index === revenuePoints.length - 1) && <text className="chart-month-label" x={point.x} y="239" textAnchor="middle">{monthYearLabel(point.month, locale)}</text>}
            </g>)}
            <line className="chart-axis-line" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
            <line className="chart-axis-line" x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} />
          </svg></div> : <p className="chart-empty">{t("Todavía no hay pagos aprobados para graficar.")}</p>}
        </article>
        <article className="glass-panel admin-chart-panel booking-status-panel">
          <div className="admin-list-heading"><div><h2>{t("Distribución de reservas")}</h2><p>{t("Distribución de todas las reservas")}</p></div><strong className="status-total">{totalBookings}</strong></div>
          <div className="booking-status-list">
            {bookingStatusRows.map((row) => {
              const percent = totalBookings ? (row.value / totalBookings) * 100 : 0;
              return <div className="booking-status-row" key={row.className}>
                <div className="booking-status-label"><span className={`status-dot ${row.className}`} /><strong>{t(row.label)}</strong><b>{row.value}</b></div>
                <div className="booking-status-track"><span className={row.className} style={{ width: `${percent}%` }} /></div>
                <small>{Math.round(percent)}%</small>
              </div>;
            })}
          </div>
        </article>
        <article className="glass-panel admin-chart-panel booking-status-panel">
          <div className="admin-list-heading"><div><h2>{t("Reservas por estado")}</h2><p>{t("Distribución de todas las reservas")}</p></div><strong className="status-total">{totalBookings}</strong></div>
          <div className="booking-pie-layout">
            <svg className="booking-pie-chart" viewBox="0 0 180 180" role="img" aria-label={t("Distribución de todas las reservas")}>
              {totalBookings ? pieSlices.map((slice) => slice.value ? <path key={slice.className} d={slice.path} fill={slice.color} stroke="#111925" strokeWidth="2" /> : null) : <circle cx="90" cy="90" r="72" fill="#253246" />}
              {totalBookings ? pieSlices.map((slice) => slice.percent >= 8 ? <text key={slice.className} className="pie-percent-label" x={slice.labelX} y={slice.labelY + 4} textAnchor="middle">{Math.round(slice.percent)}%</text> : null) : <text className="chart-axis-label" x="90" y="94" textAnchor="middle">0</text>}
            </svg>
            <div className="booking-pie-legend">
              {pieSlices.map((slice) => <div className="booking-pie-legend-row" key={slice.className}><i className={slice.className} /><span>{t(slice.label)}</span><strong>{slice.value}</strong><small>{Math.round(slice.percent)}%</small></div>)}
            </div>
          </div>
        </article>
      </section>
      <section className="glass-panel admin-list recent-panel">
        <div className="admin-list-heading"><div><h2>{t("Actividad reciente")}</h2><p>{t("Últimas reservas pagadas")}</p></div><Link className="small-link" href="/admin/services">{t("Gestionar espacios")} →</Link></div>
        <div className="admin-table-wrap"><table className="admin-data-table"><thead><tr><th>{t("Cliente")}</th><th>{t("Servicio")}</th><th>{t("Fecha y hora")}</th><th>{t("Estado")}</th><th>{t("Total")}</th></tr></thead><tbody>
          {metrics.recentBookings.length ? metrics.recentBookings.map((booking) => <tr key={booking.id}><td>{booking.customerName}</td><td>{t(booking.serviceName)}</td><td>{dateLabel(booking.date, { day: "numeric", month: "short", year: "numeric" }, locale)} · {booking.startTime}</td><td><span className="booking-status-badge">{t("Pagadas")}</span></td><td className="admin-table-total">{money(booking.total)}</td></tr>) : <tr><td className="admin-table-empty" colSpan={5}>{t("Las reservas confirmadas aparecerán aquí.")}</td></tr>}
        </tbody></table></div>
      </section>
    </main>
  );
}
