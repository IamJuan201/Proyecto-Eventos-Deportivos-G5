import { assignEmployeeAction, createEmployeeAction, toggleEmployeeAction } from "@/features/employees/api/employee.actions";
import { listStaff } from "@/features/employees/services/staff.service";
import { serviceService } from "@/features/services/services/service.service";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, employees, services] = await Promise.all([searchParams, listStaff(), serviceService.list()]);
  const activeServices = services.filter((service) => service.isActive);

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">OPERACIÓN DEL COMPLEJO</span><h1>Equipo de acceso.</h1><p>Asigna un empleado activo a cada servicio. El escáner registra lecturas a nombre del servicio seleccionado.</p></section>
      <nav className="admin-tabs" aria-label="Secciones de operación"><a href="/admin/categories">Categorías</a><a href="/admin/services">Servicios</a><a href="/admin/schedules">Horarios</a><a href="/admin/employees" aria-current="page">Empleados</a><a href="/admin/metrics">Métricas</a></nav>
      {error && <p className="booking-error">{error}</p>}
      <div className="admin-layout">
        <form action={createEmployeeAction} className="glass-panel admin-form">
          <h2>Agregar empleado</h2>
          <label>Nombre<input className="club-input" name="name" minLength={3} required placeholder="Nombre y apellidos" /></label>
          <label>Correo<input className="club-input" name="email" type="email" required placeholder="nombre@eliteclub.co" /></label>
          <label>Contraseña inicial<input className="club-input" name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" /></label>
          <label>Servicio<select className="club-input" name="serviceId" required>{activeServices.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></label>
          <button className="club-button" type="submit">Asignar empleado</button>
          <small className="field-hint">Se crea una cuenta de empleado con acceso únicamente al escáner de su espacio.</small>
        </form>
        <section className="glass-panel admin-list">
          <div className="admin-list-heading"><div><h2>Empleados asignados</h2><p>{employees.filter((item) => item.isActive).length} activos de {employees.length}</p></div><a className="small-link" href="/scanner">Abrir escáner →</a></div>
          {employees.length ? employees.map((employee) => {
            return <article className="employee-row" key={employee.id}><span className="employee-avatar">{employee.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="employee-info"><strong>{employee.name}</strong><small>{employee.email} · {employee.serviceActive ? employee.serviceName : employee.serviceName + " (inactivo)"}</small></div><form action={assignEmployeeAction} className="employee-assignment"><input type="hidden" name="id" value={employee.id} /><label className="sr-only" htmlFor={`service-${employee.id}`}>Espacio asignado</label><select className="club-input" id={`service-${employee.id}`} name="serviceId" defaultValue={employee.serviceId}>{activeServices.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="small-link" type="submit">Guardar espacio</button></form><span className={"booking-status " + (employee.isActive ? "" : "status-expirada")}>{employee.isActive ? "Activo" : "Inactivo"}</span><form action={toggleEmployeeAction}><input type="hidden" name="id" value={employee.id} /><input type="hidden" name="isActive" value={String(!employee.isActive)} /><button className="small-link" type="submit">{employee.isActive ? "Desactivar" : "Reactivar"}</button></form></article>;
          }) : <div className="empty-state">Aún no hay empleados asignados.</div>}
        </section>
      </div>
    </main>
  );
}
