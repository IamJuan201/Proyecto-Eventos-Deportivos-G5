import Link from 'next/link';
import { getJsonCurrentUser } from '@/features/auth/lib/json-auth';
import { getEmployeeAccessStats, listDemoEmployees, listDemoServices } from '@/shared/lib/demo-store';

export default async function EmployeeHomePage() {
  const user = await getJsonCurrentUser();
  if (!user) return null;
  const [employees, services] = await Promise.all([listDemoEmployees(), listDemoServices()]);
  const employee = employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase() && item.isActive);
  const service = employee && services.find((item) => item.id === employee.serviceId);
  const stats = employee ? await getEmployeeAccessStats(employee.id) : null;
  return <main className="club-container admin-wrap">
    <section className="page-heading compact-page-heading"><span className="eyebrow">PANEL DEL EMPLEADO</span><h1>Hola, {user.fullName.split(' ')[0]}.</h1><p>Tu espacio asignado: <strong>{service?.name ?? 'Sin espacio asignado'}</strong>. Desde aquí puedes revisar tu actividad y validar ingresos.</p></section>
    <nav className="admin-tabs" aria-label="Secciones del empleado"><a href="/employee" aria-current="page">Mi actividad</a><a href="/scanner">Escanear QR</a></nav>
    <section className="metrics-grid">{[
      { label: 'Lecturas hoy', value: stats?.today ?? 0, detail: 'Códigos revisados en tu turno' },
      { label: 'Ingresos autorizados hoy', value: stats?.allowedToday ?? 0, detail: 'QR aceptados en tu espacio' },
      { label: 'Revisiones rechazadas hoy', value: stats?.rejectedToday ?? 0, detail: 'Incluye QR vencidos o de otro espacio' },
      { label: 'Lecturas históricas', value: stats?.total ?? 0, detail: 'Actividad de esta cuenta' },
    ].map((item, index) => <article className="glass-panel metric-card" key={item.label}><span className="metric-index">0{index + 1}</span><small>{item.label}</small><strong>{item.value}</strong><p>{item.detail}</p></article>)}</section>
    <section className="glass-panel admin-list recent-panel"><div className="admin-list-heading"><div><h2>Lecturas recientes</h2><p>Solo se muestran intentos de tu cuenta y espacio asignado.</p></div><Link className="club-button" href="/scanner">Abrir escáner →</Link></div>{stats?.recent.length ? stats.recent.map((log) => <article className="activity-row" key={log.id}><span className="activity-check">{log.result === 'permitido' ? '✓' : '!'}</span><div><strong>{log.result.replaceAll('_', ' ')}</strong><small>{log.code} · {new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</small></div></article>) : <div className="empty-state">Aún no tienes lecturas. Abre el escáner para validar el primer ingreso.</div>}</section>
  </main>;
}
