import Link from "next/link";
import type { Category } from "@/features/categories/types/category.types";
import type { Service } from "@/features/services/types/service.types";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const money = (price: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(price);

export async function ServiceCard({ service, category }: { service: Service; category?: Category }) {
  const locale = await getLocale();
  const t = (text: string) => translate(text, locale);
  return (
    <article className="glass-panel club-card-hover service-card">
      <Link href={"/services/" + service.id} className="service-card-link">
        <div
          className={"service-art service-art-" + service.icon + " service-card-art"}
        >
          {service.imageUrl ? (
            <span
              aria-hidden="true"
              className="service-card-photo"
              style={{ backgroundImage: `linear-gradient(180deg, rgb(9 15 23 / 8%), rgb(9 15 23 / 35%)), url(${JSON.stringify(service.imageUrl)})` }}
            />
          ) : null}
        </div>
        <div className="service-card-body">
          <span className="service-category">{t(category?.name ?? "Élite Club")}</span>
          <div className="service-card-title"><h3>{t(service.name)}</h3></div>
          <p>{t(service.description)}</p>
          <div className="service-card-price"><span><strong>{money(service.price)}</strong><small> / {t(service.chargeType === "por_persona" ? "persona" : "hora")}</small></span><small>{t(service.qrType === "individual" ? "QR individual" : "QR grupal")}</small></div>
        </div>
      </Link>
    </article>
  );
}
