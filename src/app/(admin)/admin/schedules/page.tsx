import { createDemoClosureAction, deleteDemoClosureAction } from "@/features/schedules/api/demo-schedule.actions";
import { readDemoDatabase } from "@/shared/lib/demo-store";

const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, database] = await Promise.all([searchParams, readDemoDatabase()]);
  const services = database.services.filter((service) => service.isActive);
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">AGENDA DEL COMPLEJO</span><h1>Horarios y cierres.</h1><p>El horario de atención es de 8:00 a. m. a 5:00 p. m. Los lunes permanecen cerrados; registra aquí mantenimientos y fechas especiales.</p></section>
      <nav className="admin-tabs" aria-label="Secciones de operación"><a href="/admin/categories">Categorías</a><a href="/admin/services">Servicios</a><a href="/admin/schedules" aria-current="page">Horarios</a><a href="/admin/employees">Empleados</a><a href="/admin/metrics">Métricas</a></nav>
      <div className="admin-layout schedule-layout">
        <section className="glass-panel admin-list"><div className="admin-list-heading"><div><h2>Horarios por servicio</h2><p>Turnos disponibles de una hora</p></div><span className="schedule-clock">08:00 — 17:00</span></div>
          {services.map((service) => <article className="schedule-row" key={service.id}><div><strong>{service.name}</strong><small>{service.capacity} {service.chargeType === "por_persona" ? "cupos por hora" : "espacios simultáneos"}</small></div><span>{service.operatingDays.map((day) => weekdays[day].slice(0, 2)).join(" · ")}</span></article>)}
        </section>
        <form action={createDemoClosureAction} className="glass-panel admin-form">
          <h2>Registrar cierre</h2><p>Se bloqueará la disponibilidad para nuevas reservas en el rango seleccionado.</p>
          <label>Servicio<select className="club-input" name="serviceId"><option value="*">Todo el complejo</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
          <div className="booking-count-grid"><label>Desde<input className="club-input" type="date" name="from" required /></label><label>Hasta<input className="club-input" type="date" name="to" required /></label></div>
          <label>Motivo<input className="club-input" name="reason" required minLength={3} placeholder="Mantenimiento preventivo" /></label>
          {error && <p className="booking-error">{error}</p>}<button className="club-button" type="submit">Guardar cierre</button>
        </form>
      </div>
      <section className="glass-panel admin-list closures-panel"><div className="admin-list-heading"><div><h2>Cierres registrados</h2><p>{database.closures.length} bloqueos de agenda</p></div></div>
        {database.closures.length ? database.closures.map((closure, index) => <article className="schedule-row" key={closure.from + closure.to + index}><div><strong>{closure.reason}</strong><small>{closure.serviceId === "*" ? "Todo el complejo" : services.find((service) => service.id === closure.serviceId)?.name ?? "Servicio"}</small></div><span>{closure.from} — {closure.to}</span><form action={deleteDemoClosureAction}><input type="hidden" name="index" value={index} /><button type="submit" className="small-link">Eliminar cierre</button></form></article>) : <div className="empty-state">No hay cierres adicionales. Los lunes ya están bloqueados por regla del complejo.</div>}
      </section>
    </main>
  );
}
