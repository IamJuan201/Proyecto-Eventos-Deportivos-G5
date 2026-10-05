import { ServiceCard } from "@/shared/components/service-card";
import { listDemoCategories, listDemoServices } from "@/shared/lib/demo-store";

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([listDemoServices(), listDemoCategories()]);
  const activeCategories = categories.filter((category) => category.isActive);
  const availableServices = services.filter((service) => service.isActive);

  return (
    <main className="club-container">
      <section className="page-heading">
        <span className="eyebrow">ESPACIOS ÉLITE · AGENDA ABIERTA</span>
        <h1>Encuentra tu próximo <span className="heading-accent">lugar favorito.</span></h1>
        <p>Reserva por horas o por persona. Elige fecha y turno para ver la disponibilidad actualizada.</p>
      </section>
      {activeCategories.map((category) => {
        const categoryServices = availableServices.filter((service) => service.categoryId === category.id);
        if (!categoryServices.length) return null;
        return (
          <section className="catalog-section" key={category.id}>
            <div className="catalog-title-row"><div><h2>{category.name}</h2><p>{category.description}</p></div><span>{categoryServices.length.toString().padStart(2, "0")} ESPACIOS</span></div>
            <div className="service-grid">
              {categoryServices.map((service) => <ServiceCard key={service.id} service={service} category={category} />)}
            </div>
          </section>
        );
      })}
      {!availableServices.length && <div className="empty-state">El catálogo se está actualizando. Vuelve pronto.</div>}
      <div className="catalog-policy glass-panel"><span aria-hidden="true">◷</span><p><strong>Tu reserva, sin sorpresas.</strong> Agenda de martes a domingo, de 8:00 a. m. a 5:00 p. m. Puedes reservar hasta con 15 días de anticipación.</p></div>
    </main>
  );
}
