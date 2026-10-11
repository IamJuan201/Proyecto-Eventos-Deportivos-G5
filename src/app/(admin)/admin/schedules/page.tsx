import { createClosureAction, deleteClosureAction } from "@/features/schedules/api/schedule.actions";
import { AdminTabs } from "@/shared/components/admin-tabs";
import { closureTypes, listActiveClosures } from "@/features/schedules/services/closure.service";
import { serviceService } from "@/features/services/services/service.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, allServices, closures, locale] = await Promise.all([searchParams, serviceService.list(), listActiveClosures(), getLocale()]);
  const t = (text: string) => translate(text, locale);
  const services = allServices.filter((service) => service.isActive);
  return (
    <main className="club-container admin-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("AGENDA DEL COMPLEJO")}</span><h1>{t("Horarios y cierres.")}</h1><p>{t("El horario de atención es de 8:00 a. m. a 5:00 p. m. Los lunes permanecen cerrados; registra aquí mantenimientos y fechas especiales.")}</p></section>
      <AdminTabs active="/admin/schedules" />
      <div className="admin-layout schedule-layout">
        <section className="glass-panel admin-list"><div className="admin-list-heading"><div><h2>{t("Horarios por servicio")}</h2><p>{t("Turnos disponibles de una hora")}</p></div><span className="schedule-clock">08:00 — 17:00</span></div>
          {services.map((service) => <article className="schedule-row" key={service.id}><div><strong>{t(service.name)}</strong><small>{service.capacity} {t(service.chargeType === "por_persona" ? "cupos por hora" : "espacios simultáneos")}</small></div><span>{service.operatingDays.map((day) => t(weekdays[day]).slice(0, 2)).join(" · ")}</span></article>)}
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
        {closures.length ? closures.map((closure) => <article className="schedule-row" key={closure.id}><div><strong>{t(closure.reason)}</strong><small>{t(closure.serviceName ?? "Todo el complejo")} · {t(closureTypes.find((type) => type.value === closure.type)?.label ?? "")}</small></div><span>{closure.from} — {closure.to}</span><form action={deleteClosureAction}><input type="hidden" name="id" value={closure.id} /><button type="submit" className="small-link">{t("Eliminar cierre")}</button></form></article>) : <div className="empty-state">{t("No hay cierres adicionales. Los lunes ya están bloqueados por regla del complejo.")}</div>}
      </section>
    </main>
  );
}
