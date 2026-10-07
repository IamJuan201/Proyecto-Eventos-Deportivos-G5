import Link from "next/link";
import type { DemoCategory, DemoService } from "@/shared/lib/demo-store";

const symbols: Record<string, string> = { water: "〰", waves: "≈", slides: "≋", kids: "✦", fitness: "✣", wellness: "◌", football: "◈", micro: "▦", court: "⌗" };
const money = (price: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(price);

export function ServiceCard({ service, category }: { service: DemoService; category?: DemoCategory }) {
  const art = service.artwork || category?.artwork || "court";
  return (
    <article className="glass-panel club-card-hover service-card">
      <Link href={"/services/" + service.id} className="service-card-link">
        <div className={"service-art service-art-" + art + " service-card-art"}>
          <div className="service-card-meta"><span className="eyebrow">{service.tag}</span><span className="service-symbol" aria-hidden="true">{symbols[art] ?? "✦"}</span></div>
        </div>
        <div className="service-card-body">
          <span className="service-category">{category?.name ?? "Élite Club"}</span>
          <div className="service-card-title"><h3>{service.name}</h3></div>
          <p>{service.description}</p>
          <div className="service-card-price"><span><strong>{money(service.price)}</strong><small> / {service.chargeType === "por_persona" ? "persona" : "hora"}</small></span><small>{service.qrType === "individual" ? "QR individual" : "QR grupal"}</small></div>
        </div>
      </Link>
    </article>
  );
}
