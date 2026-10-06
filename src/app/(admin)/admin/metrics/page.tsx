import Link from "next/link";
import { getDashboardMetrics } from "@/features/metrics/services/metrics.service";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export default async function MetricsPage() {
  const metrics = await getDashboardMetrics();
  const cards = [
    { label: "Ingresos aprobados", value: money(metrics.approvedIncome), detail: "Pagos aprobados acumulados" },
    { label: "Reservas pagadas", value: String(metrics.paidBookings), detail: metrics.bookedPeople + " personas reservadas" },
    { label: "Accesos permitidos", value: String(metrics.allowedAccesses), detail: metrics.accessReads + " lecturas registradas" },
    { label: "Empleados activos", value: String(metrics.activeEmployees), detail: "Asignados a un servicio" },
  ];
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">PANEL DE OPERACIÓN</span><h1>El club, en cifras.</h1><p>Las métricas se calculan con las reservas, pagos y accesos registrados en la base de datos.</p></section>
      <nav className="admin-tabs" aria-label="Secciones de operación"><a href="/admin/categories">Categorías</a><a href="/admin/services">Servicios</a><a href="/admin/schedules">Horarios</a><a href="/admin/employees">Empleados</a><a href="/admin/metrics" aria-current="page">Métricas</a></nav>
      <section className="metrics-grid">{cards.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="glass-panel admin-list recent-panel"><div className="admin-list-heading"><div><h2>Actividad reciente</h2><p>Últimas reservas pagadas</p></div><Link className="small-link" href="/admin/services">Gestionar espacios →</Link></div>{metrics.recentBookings.length ? metrics.recentBookings.map((booking) => <article className="activity-row" key={booking.id}><span className="activity-check">✓</span><div><strong>{booking.serviceName}</strong><small>{booking.customerName} · {booking.date} · {booking.startTime}</small></div><b>{money(booking.total)}</b></article>) : <div className="empty-state">Cuando confirmes un pago de prueba, aparecerá aquí.</div>}</section>
    </main>
  );
}
