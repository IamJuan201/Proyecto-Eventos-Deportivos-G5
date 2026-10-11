import { ServiceCard } from "@/shared/components/service-card";
import { ServiceCarousel } from "@/shared/components/service-carousel";
import { categoryService } from "@/features/categories/services/category.service";
import { serviceService } from "@/features/services/services/service.service";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

export default async function ServicesPage() {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  const [services, categories] = await Promise.all([serviceService.list(), categoryService.list()]);
  const activeCategories = categories.filter((category) => category.isActive);
  const availableServices = services.filter((service) => service.isActive);

  return (
    <main className="club-container">
      <section className="page-heading">
        <span className="eyebrow">{t("ESPACIOS ÉLITE · AGENDA ABIERTA")}</span>
        <h1>{t("Encuentra tu próximo")} <span className="heading-accent">{t("lugar favorito.")}</span></h1>
        <p>{t("Reserva por horas o por persona. Elige fecha y turno para ver la disponibilidad actualizada.")}</p>
      </section>

      {availableServices.length > 0 && (
        <section className="catalog-carousel-highlight">
          <ServiceCarousel
            services={availableServices}
            categoriesMap={Object.fromEntries(categories.map((c) => [c.id, c]))}
            eyebrow="DESTACADOS ÉLITE"
            title="Explora en movimiento"
            subtitle="Desliza para descubrir canchas, piscinas, gimnasio y bienestar."
            showAllLink={false}
          />
        </section>
      )}
      {activeCategories.map((category) => {
        const categoryServices = availableServices.filter((service) => service.categoryId === category.id);
        if (!categoryServices.length) return null;
        return (
          <section className="catalog-section" key={category.id}>
            <div className="catalog-title-row"><div><h2>{t(category.name)}</h2><p>{t(category.description)}</p></div><span>{categoryServices.length.toString().padStart(2, "0")} {t("ESPACIOS")}</span></div>
            <div className="service-grid">
              {categoryServices.map((service) => <ServiceCard key={service.id} service={service} category={category} />)}
            </div>
          </section>
        );
      })}
      {!availableServices.length && <div className="empty-state">{t("El catálogo se está actualizando. Vuelve pronto.")}</div>}
      <div className="catalog-policy glass-panel"><span aria-hidden="true">◷</span><p><strong>{t("Tu reserva, sin sorpresas.")}</strong> {t("Agenda de martes a domingo, de 8:00 a. m. a 5:00 p. m. Puedes reservar hasta con 15 días de anticipación.")}</p></div>
    </main>
  );
}
