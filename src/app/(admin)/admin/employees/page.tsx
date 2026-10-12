import { assignEmployeeAction, changeEmployeePasswordAction, createEmployeeAction, toggleEmployeeAction } from "@/features/employees/api/employee.actions";
import { requireAdmin } from "@/features/auth/lib/session";
import { AdminTabs } from "@/shared/components/admin-tabs";
import { listStaff } from "@/features/employees/services/staff.service";
import { serviceService } from "@/features/services/services/service.service";
import { PasswordInput } from "@/shared/components/password-input";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [{ error }, employees, services, locale] = await Promise.all([searchParams, listStaff(), serviceService.list(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const activeServices = services.filter((service) => service.isActive);

  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("OPERACIÓN DEL COMPLEJO")}</span><h1>{t("Equipo de acceso.")}</h1><p>{t("Asigna un empleado activo a cada servicio. El escáner registra lecturas a nombre del servicio seleccionado.")}</p></section>
      <AdminTabs active="/admin/employees" />
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
          <div className="admin-list-heading"><div><h2>{t("Empleados asignados")}</h2><p>{employees.filter((item) => item.isActive).length} {t("activos de")} {employees.length}</p></div></div>
          {employees.length ? employees.map((employee) => {
            return <article className="employee-card" key={employee.id}>
              <div className="employee-card-heading"><span className="employee-avatar">{employee.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="employee-info"><strong>{employee.name}</strong><small>{employee.email}</small></div><form action={toggleEmployeeAction}><input type="hidden" name="id" value={employee.id} /><input type="hidden" name="isActive" value={String(!employee.isActive)} /><button className={`booking-status service-status-control${employee.isActive ? " employee-active" : " status-expirada"}`} type="submit" aria-label={`${t(employee.isActive ? "Desactivar empleado" : "Activar empleado")}: ${employee.name}`}>{t(employee.isActive ? "Activo" : "Inactivo")}</button></form></div>
              <div className="employee-controls">
                <form action={assignEmployeeAction} className="employee-control-group"><input type="hidden" name="id" value={employee.id} /><label htmlFor={`service-${employee.id}`}>{t("Espacio asignado")}</label><div className="employee-control-fields"><select className="club-input" id={`service-${employee.id}`} name="serviceId" defaultValue={employee.serviceId}>{!employee.serviceActive && <option value={employee.serviceId} disabled>{t(employee.serviceName)} · {t("Inactivo")}</option>}{activeServices.map((item) => <option value={item.id} key={item.id}>{t(item.name)}</option>)}</select><button className="club-button club-button-secondary" type="submit">{t("Guardar espacio")}</button></div>{!employee.serviceActive && <small className="employee-warning">{t("El espacio asignado está inactivo.")}</small>}</form>
                <form action={changeEmployeePasswordAction} className="employee-control-group"><input type="hidden" name="id" value={employee.id} /><label htmlFor={`password-${employee.id}`}>{t("Cambiar contraseña")}</label><div className="employee-control-fields"><PasswordInput className="club-input" id={`password-${employee.id}`} name="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder={t("Nueva contraseña")} /><button className="club-button club-button-secondary" type="submit">{t("Actualizar")}</button></div></form>
              </div>
            </article>;
          }) : <div className="empty-state">{t("Aún no hay empleados asignados.")}</div>}
        </section>
      </div>
    </main>
  );
}
