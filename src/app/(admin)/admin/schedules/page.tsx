import { createClosureAction, deleteClosureAction } from "@/features/schedules/api/schedule.actions";
import { requireAdmin } from "@/features/auth/lib/session";
import { AdminTabs } from "@/shared/components/admin-tabs";
import { closureTypes, listActiveClosures } from "@/features/schedules/services/closure.service";
import { serviceService } from "@/features/services/services/service.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";
import Link from "next/link";
import { bogotaDate, dayOfWeek } from "@/shared/lib/bogota-time";
import type { WeekDay } from "@/features/services/types/service.types";

const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [{ error }, allServices, closures, locale] = await Promise.all([searchParams, serviceService.list(), listActiveClosures(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const services = allServices;
  const today = bogotaDate();
  const visibleDates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    const value = date.toISOString().slice(0, 10);
    return { value, weekday: dayOfWeek(value) as WeekDay, dayNumber: value.slice(-2) };
  });
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("AGENDA DEL COMPLEJO")}</span><h1>{t("Horarios y cierres.")}</h1><p>{t("El horario de atención es de 8:00 a. m. a 5:00 p. m. Los lunes permanecen cerrados; registra aquí mantenimientos y fechas especiales.")}</p></section>
      <AdminTabs active="/admin/schedules" />
      <div className="admin-layout schedule-layout">
        <section className="glass-panel admin-list"><div className="admin-list-heading"><div><h2>{t("Horarios por servicio")}</h2><p>{t("Turnos disponibles de una hora")}</p></div><div className="schedule-clock"><small>{t("Horario del complejo")}</small><strong>08:00 — 17:00</strong></div></div>
          {services.map((service) => {
            const serviceClosures = closures.filter((closure) => (closure.serviceId === null || closure.serviceId === service.id) && closure.to >= today).sort((left, right) => left.from.localeCompare(right.from));
            const currentClosure = serviceClosures.find((closure) => closure.from <= today && closure.to >= today);
            const nextClosure = currentClosure ?? serviceClosures[0];
            const isUnavailable = !service.isActive || Boolean(currentClosure);
            return <Link className="schedule-row schedule-service-row" href={`/admin/services?edit=${service.id}`} key={service.id} aria-label={`${t("Editar horario de")} ${t(service.name)}`}>
              <div className="schedule-service-copy"><strong>{t(service.name)}</strong><small>{service.capacity} {t(service.chargeType === "por_persona" ? "cupos por hora" : "espacios simultáneos")}</small></div>
              <div className="schedule-service-meta">
                <span className={`schedule-active-state ${isUnavailable ? "is-inactive" : ""}`}><i aria-hidden="true" />{t(currentClosure ? "Inactivo por cierre" : service.isActive ? "Activo" : "Servicio inactivo")}</span>
                <span className="schedule-days" aria-label={t("Disponibilidad de los próximos siete días")}>{visibleDates.map(({ value, weekday, dayNumber }) => {
                  const closure = serviceClosures.find((item) => item.from <= value && item.to >= value);
                  const closedByRule = weekday === 1;
                  const isOpen = service.isActive && !closedByRule && !closure && service.operatingDays.includes(weekday);
                  const dayClass = isOpen ? "is-open" : `is-closed${closure ? " is-closure-day" : ""}`;
                  const dayTitle = closure ? `${t("Inactivo por cierre")}: ${t(closure.reason)}` : isOpen ? "Disponible" : closedByRule ? "Cerrado todos los lunes" : service.isActive ? "No opera este día" : "Servicio inactivo";
                  return <span className={dayClass} key={value} title={`${t(weekdays[weekday])} ${dayNumber}: ${t(dayTitle)}`}><b>{t(weekdays[weekday]).slice(0, 2)}</b><small>{dayNumber}</small></span>;
                })}</span>
                {nextClosure && <span className={`schedule-closure-note ${currentClosure ? "is-current" : ""}`}><strong>{t(currentClosure ? "Inactivo hasta" : "Próximo cierre")}</strong> {currentClosure ? currentClosure.to : `${nextClosure.from} — ${nextClosure.to}`} · {t(nextClosure.reason)}</span>}
                <span className="schedule-edit-hint">{t("Editar días")} →</span>
              </div>
            </Link>;
          })}
        </section>
        <form action={createClosureAction} className="glass-panel admin-form">
          <h2>{t("Registrar cierre")}</h2><p>{t("Se bloqueará la disponibilidad para nuevas reservas en el rango seleccionado.")}</p>
          <label>{t("Servicio")}<select className="club-input" name="serviceId"><option value="*">{t("Todo el complejo")}</option>{services.map((service) => <option key={service.id} value={service.id}>{t(service.name)}</option>)}</select></label>
          <div className="booking-count-grid"><label>{t("Desde")}<input className="club-input" type="date" name="from" required /></label><label>{t("Hasta")}<input className="club-input" type="date" name="to" required /></label></div>
          <label>{t("Tipo")}<select className="club-input" name="type" defaultValue="mantenimiento">{closureTypes.map((type) => <option key={type.value} value={type.value}>{t(type.label)}</option>)}</select></label>
          <label>{t("Motivo")}<input className="club-input" name="reason" required minLength={3} placeholder={t("Mantenimiento preventivo")} /></label>
          {error && <p className="booking-error">{t(error)}</p>}<button className="club-button" type="submit">{t("Guardar cierre")}</button>
        </form>
      </div>
      <section className="glass-panel admin-list closures-panel"><div className="admin-list-heading"><div><h2>{t("Cierres registrados")}</h2><p>{closures.length} {t("bloqueos de agenda")}</p></div></div>
        {closures.length ? closures.map((closure) => {
          const closureState = closure.from <= today && closure.to >= today ? "Inactivo ahora" : closure.from > today ? "Programado" : "Finalizado";
          const stateClass = closureState === "Finalizado" ? "is-past" : closureState === "Programado" ? "is-scheduled" : "is-current";
          return <article className="schedule-row closure-row" key={closure.id}><div className="closure-copy"><strong>{t(closure.reason)}</strong><small>{t(closure.serviceName ?? "Todo el complejo")} · {t(closureTypes.find((type) => type.value === closure.type)?.label ?? "")}</small></div><div className="closure-date-state"><span className={`closure-state ${stateClass}`}>{t(closureState)}</span><span className="closure-dates">{closure.from} — {closure.to}</span></div><form action={deleteClosureAction}><input type="hidden" name="id" value={closure.id} /><button type="submit" className="small-link">{t("Eliminar cierre")}</button></form></article>;
        }) : <div className="empty-state">{t("No hay cierres adicionales. Los lunes ya están bloqueados por regla del complejo.")}</div>}
      </section>
    </main>
  );
}
