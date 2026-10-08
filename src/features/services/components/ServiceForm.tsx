"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Category } from "@/features/categories/types/category.types";
import { saveService, type ServiceFormState } from "@/features/services/api/service.actions";
import { chargeTypes, qrTypes, serviceIcons, weekDays, type Service } from "@/features/services/types/service.types";
import { useTranslate } from "@/shared/i18n/locale-provider";

const initialState: ServiceFormState = {};

interface ServiceFormProps {
  categories: Category[];
  service?: Service;
}

export function ServiceForm({ categories, service }: ServiceFormProps) {
  const t = useTranslate();
  const [state, formAction, pending] = useActionState(saveService, initialState);
  const selectableCategories = categories.filter(
    (category) => category.isActive || category.id === service?.categoryId,
  );

  return (
    <form action={formAction} className="glass-panel admin-form">
      <h2>{t(service ? "Editar servicio" : "Nuevo servicio")}</h2>
      <p>{t("Cada servicio es un espacio reservable con su propia agenda (Cancha 1 no afecta a Cancha 2).")}</p>
      {service && <input type="hidden" name="id" value={service.id} />}

      <label>
        {t("Nombre")}
        <input
          className="club-input"
          name="name"
          defaultValue={service?.name}
          required
          minLength={3}
          maxLength={80}
          placeholder={t("Cancha 1")}
        />
      </label>

      <label>
        {t("Categoría")}
        <select className="club-input" name="categoryId" defaultValue={service?.categoryId ?? ""} required>
          <option value="" disabled>
            {t("Selecciona una categoría")}
          </option>
          {selectableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {t(category.name)}
              {!category.isActive && ` (${t("inactiva")})`}
            </option>
          ))}
        </select>
      </label>

      <div className="booking-count-grid">
        <label>
          {t("Tipo de cobro")}
          <select className="club-input" name="chargeType" defaultValue={service?.chargeType ?? "por_hora"}>
            {chargeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Precio (COP)")}
          <input
            className="club-input"
            name="price"
            type="number"
            min={0}
            step="any"
            defaultValue={service?.price}
            required
          />
        </label>
      </div>

      <div className="booking-count-grid">
        <label>
          {t("Capacidad por turno")}
          <input
            className="club-input"
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={service?.capacity ?? 1}
            required
          />
        </label>
        <label>
          {t("Personas por reserva")}
          <input
            className="club-input"
            name="capacityPeople"
            type="number"
            min={1}
            step={1}
            defaultValue={service?.capacityPeople ?? 10}
            required
          />
        </label>
      </div>

      <div className="booking-count-grid">
        <label>
          {t("Tipo de QR")}
          <select className="club-input" name="qrType" defaultValue={service?.qrType ?? "grupal"}>
            {qrTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Ilustración")}
          <select className="club-input" name="icon" defaultValue={service?.icon ?? "court"}>
            {serviceIcons.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {t(icon.label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <small className="field-hint">
        {t("Capacidad por turno: espacios simultáneos si se cobra por hora, o cupos si se cobra por persona.")}
      </small>

      <label>
        {t("Etiqueta destacada")}
        <input
          className="club-input"
          name="tag"
          defaultValue={service?.tag}
          maxLength={60}
          placeholder={t("Hasta 20 jugadores")}
        />
      </label>

      <label>
        {t("URL de la imagen")}
        <input
          className="club-input"
          name="imageUrl"
          type="url"
          defaultValue={service?.imageUrl}
          placeholder="https://..."
        />
      </label>

      <label>
        {t("Descripción")}
        <textarea
          className="club-input"
          name="description"
          defaultValue={service?.description}
          maxLength={500}
          rows={3}
        />
      </label>

      <fieldset className="booking-count-grid">
        <legend className="field-hint">{t("Días de operación")}</legend>
        {weekDays.map((day) => (
          <label key={day.value} className="terms-label">
            <input
              type="checkbox"
              name="operatingDays"
              value={day.value}
              defaultChecked={service?.operatingDays.includes(day.value)}
            />
            {t(day.label)}
          </label>
        ))}
      </fieldset>

      {state.error && <p className="booking-error">{t(state.error)}</p>}
      {state.success && <p className="field-hint">{t("Servicio creado.")}</p>}

      <button className="club-button" type="submit" disabled={pending}>
        {pending ? t("Guardando...") : t("Guardar servicio")}
      </button>
      {service && (
        <Link href="/admin/services" className="club-button club-button-secondary">
          {t("Cancelar")}
        </Link>
      )}
    </form>
  );
}
