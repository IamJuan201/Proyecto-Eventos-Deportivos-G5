import Link from "next/link";
import { getDashboardMetrics, type SalesPeak } from "@/features/metrics/services/metrics.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions, locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { ...options, timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
const weekLabel = (monday: string, locale: string) => {
  const sunday = new Date(monday + "T00:00:00Z");
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return dateLabel(monday, { day: "numeric", month: "short" }, locale) + " – " + dateLabel(sunday.toISOString().slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale);
};
const peakDetail = (peak: SalesPeak) => money(peak.total) + " · " + peak.payments + (peak.payments === 1 ? " pago" : " pagos");

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
  const peaks = [
    { label: "Día con más ventas", value: day ? dateLabel(day.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" }, locale) : "—", detail: day ? peakDetail(day) : "Sin pagos aprobados" },
    { label: "Semana con más ventas", value: week ? weekLabel(week.start, locale) : "—", detail: week ? peakDetail(week) : "Sin pagos aprobados" },
    { label: "Mes con más ventas", value: month ? dateLabel(month.start, { month: "long", year: "numeric" }, locale) : "—", detail: month ? peakDetail(month) : "Sin pagos aprobados" },
  ];
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("PANEL DE OPERACIÓN")}</span><h1>{t("El club, en cifras.")}</h1><p>{t("Las métricas se calculan con las reservas, pagos y accesos registrados en la base de datos.")}</p></section>
      <nav className="admin-tabs" aria-label={t("Secciones de operación")}><a href="/admin/categories">{t("Categorías")}</a><a href="/admin/services">{t("Servicios")}</a><a href="/admin/schedules">{t("Horarios")}</a><a href="/admin/employees">{t("Empleados")}</a><a href="/admin/metrics" aria-current="page">{t("Métricas")}</a></nav>
      <section className="metrics-grid">{cards.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="metrics-grid" style={{ marginTop: 11 }} aria-label="Periodos con más ventas">{peaks.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{cards.length + index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="glass-panel admin-list recent-panel"><div className="admin-list-heading"><div><h2>{t("Actividad reciente")}</h2><p>{t("Últimas reservas pagadas")}</p></div><Link className="small-link" href="/admin/services">{t("Gestionar espacios")} →</Link></div>{metrics.recentBookings.length ? metrics.recentBookings.map((booking) => <article className="activity-row" key={booking.id}><span className="activity-check">✓</span><div><strong>{t(booking.serviceName)}</strong><small>{booking.customerName} · {booking.date} · {booking.startTime}</small></div><b>{money(booking.total)}</b></article>) : <div className="empty-state">{t("Cuando confirmes un pago de prueba, aparecerá aquí.")}</div>}</section>
    </main>
  );
}
