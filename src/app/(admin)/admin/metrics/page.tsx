import Link from "next/link";
import { readDemoDatabase } from "@/shared/lib/demo-store";

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export default async function MetricsPage() {
  const db = await readDemoDatabase();
  const paid = db.reservations.filter((booking) => booking.status === "pagada");
  const accepted = db.accessLogs.filter((log) => log.result === "permitido");
  const amount = db.payments.filter((payment) => payment.status === "aprobado").reduce((sum, payment) => sum + payment.amount, 0);
  const cards = [
    { label: "Ingresos aprobados", value: money(amount), detail: "Pagos de prueba acumulados" },
    { label: "Reservas pagadas", value: String(paid.length), detail: paid.reduce((sum, booking) => sum + booking.people, 0) + " personas reservadas" },
    { label: "Accesos permitidos", value: String(accepted.length), detail: db.accessLogs.length + " lecturas registradas" },
    { label: "Empleados activos", value: String(db.employees.filter((employee) => employee.isActive).length), detail: "Asignados a un servicio" },
  ];
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">PANEL DE OPERACIÓN · DEMO</span><h1>El club, en cifras.</h1><p>Las métricas se calculan con reservas y accesos registrados en este entorno de demostración.</p></section>
      <nav className="admin-tabs" aria-label="Secciones de operación"><a href="/admin/categories">Categorías</a><a href="/admin/services">Servicios</a><a href="/admin/schedules">Horarios</a><a href="/admin/employees">Empleados</a><a href="/admin/metrics" aria-current="page">Métricas</a></nav>
      <section className="metrics-grid">{cards.map((card, index) => <article className="glass-panel metric-card" key={card.label}><span className="metric-index">0{index + 1}</span><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></article>)}</section>
      <section className="glass-panel admin-list recent-panel"><div className="admin-list-heading"><div><h2>Actividad reciente</h2><p>Reservas y pagos del demo</p></div><Link className="small-link" href="/admin/services">Gestionar espacios →</Link></div>{paid.length ? [...paid].reverse().slice(0, 5).map((booking) => <article className="activity-row" key={booking.id}><span className="activity-check">✓</span><div><strong>{booking.serviceName}</strong><small>{booking.customerName} · {booking.date} · {booking.startTime}</small></div><b>{money(booking.total)}</b></article>) : <div className="empty-state">Cuando confirmes un pago de prueba, aparecerá aquí.</div>}</section>
    </main>
  );
}
