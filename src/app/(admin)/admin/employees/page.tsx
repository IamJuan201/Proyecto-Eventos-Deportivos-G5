import { assignEmployeeAction, changeEmployeePasswordAction, createEmployeeAction, toggleEmployeeAction } from "@/features/employees/api/employee.actions";
import { listStaff } from "@/features/employees/services/staff.service";
import { serviceService } from "@/features/services/services/service.service";
import { PasswordInput } from "@/shared/components/password-input";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, employees, services, locale] = await Promise.all([searchParams, listStaff(), serviceService.list(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const activeServices = services.filter((service) => service.isActive);

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("OPERACIÓN DEL COMPLEJO")}</span><h1>{t("Equipo de acceso.")}</h1><p>{t("Asigna un empleado activo a cada servicio. El escáner registra lecturas a nombre del servicio seleccionado.")}</p></section>
      <nav className="admin-tabs" aria-label={t("Secciones de operación")}><a href="/admin/categories">{t("Categorías")}</a><a href="/admin/services">{t("Servicios")}</a><a href="/admin/schedules">{t("Horarios")}</a><a href="/admin/employees" aria-current="page">{t("Empleados")}</a><a href="/admin/metrics">{t("Métricas")}</a></nav>
      {error && <p className="booking-error">{t(error)}</p>}
      <div className="admin-layout">
        <form action={createEmployeeAction} className="glass-panel admin-form">
          <h2>{t("Agregar empleado")}</h2>
          <label>{t("Nombre")}<input className="club-input" name="name" minLength={3} required placeholder={t("Nombre y apellidos")} /></label>
          <label>{t("Correo")}<input className="club-input" name="email" type="email" required placeholder="nombre@eliteclub.co" /></label>
          <label>{t("Contraseña inicial")}<PasswordInput className="club-input" name="password" required minLength={8} placeholder={t("Mínimo 8 caracteres")} /></label>
          <label>{t("Servicio")}<select className="club-input" name="serviceId" required>{activeServices.map((service) => <option value={service.id} key={service.id}>{t(service.name)}</option>)}</select></label>
          <button className="club-button" type="submit">{t("Asignar empleado")}</button>
          <small className="field-hint">{t("Se crea una cuenta de empleado con acceso únicamente al escáner de su espacio.")}</small>
        </form>
        <section className="glass-panel admin-list">
          <div className="admin-list-heading"><div><h2>{t("Empleados asignados")}</h2><p>{employees.filter((item) => item.isActive).length} {t("activos de")} {employees.length}</p></div><a className="small-link" href="/scanner">{t("Abrir escáner")} →</a></div>
          {employees.length ? employees.map((employee) => {
            return <article className="employee-row" key={employee.id}><span className="employee-avatar">{employee.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="employee-info"><strong>{employee.name}</strong><small>{employee.email} · {t(employee.serviceActive ? employee.serviceName : employee.serviceName + " (inactivo)")}</small></div><form action={assignEmployeeAction} className="employee-assignment"><input type="hidden" name="id" value={employee.id} /><label className="sr-only" htmlFor={`service-${employee.id}`}>{t("Espacio asignado")}</label><select className="club-input" id={`service-${employee.id}`} name="serviceId" defaultValue={employee.serviceId}>{activeServices.map((item) => <option value={item.id} key={item.id}>{t(item.name)}</option>)}</select><button className="small-link" type="submit">{t("Guardar espacio")}</button></form><form action={changeEmployeePasswordAction} className="employee-assignment"><input type="hidden" name="id" value={employee.id} /><label className="sr-only" htmlFor={`password-${employee.id}`}>{t("Nueva contraseña de")} {employee.name}</label><PasswordInput className="club-input" id={`password-${employee.id}`} name="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder={t("Nueva contraseña")} /><button className="small-link" type="submit">{t("Cambiar contraseña")}</button></form><span className={"booking-status " + (employee.isActive ? "" : "status-expirada")}>{t(employee.isActive ? "Activo" : "Inactivo")}</span><form action={toggleEmployeeAction}><input type="hidden" name="id" value={employee.id} /><input type="hidden" name="isActive" value={String(!employee.isActive)} /><button className="small-link" type="submit">{t(employee.isActive ? "Desactivar" : "Reactivar")}</button></form></article>;
          }) : <div className="empty-state">{t("Aún no hay empleados asignados.")}</div>}
        </section>
      </div>
    </main>
  );
}
