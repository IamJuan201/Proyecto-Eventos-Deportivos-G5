"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Service } from "@/features/services/types/service.types";
import type { Category } from "@/features/categories/types/category.types";
import { useTranslate } from "@/shared/i18n/locale-provider";

const symbols: Record<string, string> = {
  water: "〰",
  waves: "≈",
  slides: "≋",
  kids: "✦",
  fitness: "✣",
  wellness: "◌",
  football: "◈",
  micro: "▦",
  court: "⌗",
};

const formatMoney = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

interface ServiceCarouselProps {
  services: Service[];
  categoriesMap: Record<string, Category>;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  showAllLink?: boolean;
}

export function ServiceCarousel({
  services,
  categoriesMap,
  title,
  subtitle,
  eyebrow,
  showAllLink = true,
}: ServiceCarouselProps) {
  const t = useTranslate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const getMetrics = useCallback(() => {
    const el = trackRef.current;
    if (!el) return { cardWidth: 300, gap: 16 };
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth || 300;
    const style = window.getComputedStyle(el);
    const gap = parseFloat(style.columnGap || style.gap || "16") || 16;
    return { cardWidth, gap };
  }, []);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const { cardWidth, gap } = getMetrics();
    const newIndex = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(services.length - 1, Math.max(0, newIndex)));
  }, [services.length, getMetrics]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollByDirection = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const { cardWidth, gap } = getMetrics();
    const offset = (cardWidth + gap) * (direction === "left" ? -1 : 1);
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { cardWidth, gap } = getMetrics();
    el.scrollTo({ left: (cardWidth + gap) * index, behavior: "smooth" });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    scrollStartRef.current = el.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
      el.scrollLeft = scrollStartRef.current - dx;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
    }
  };

  return (
    <div className="carousel-wrapper">
      <div className="carousel-header">
        <div>
          <span className="eyebrow">{eyebrow ? t(eyebrow) : t("ENCUENTRA TU ESPACIO")}</span>
          <h2 className="carousel-title">
            {title ? t(title) : (
              <>
                {t("Hoy se siente como")}{" "}
                <span className="text-sky-400">{t("día de juego.")}</span>
              </>
            )}
          </h2>
          <p className="carousel-subtitle">
            {subtitle ? t(subtitle) : t("Elige tu experiencia. Nosotros preparamos el resto.")}
          </p>
        </div>

        <div className="carousel-controls">
          {showAllLink && (
            <Link href="/services" className="carousel-all-link">
              {t("Ver todos los espacios")}
            </Link>
          )}
          <div className="carousel-nav-buttons" role="group" aria-label="Controles del carrusel">
            <button
              type="button"
              className="carousel-btn"
              onClick={() => scrollByDirection("left")}
              disabled={!canScrollLeft}
              aria-label={t("Anterior")}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="carousel-btn"
              onClick={() => scrollByDirection("right")}
              disabled={!canScrollRight}
              aria-label={t("Siguiente")}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="carousel-track-container">
        <div
          ref={trackRef}
          className="carousel-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {services.map((service) => {
            const category = categoriesMap[service.categoryId];
            const art = service.icon;
            return (
              <article key={service.id} className="glass-panel carousel-card group">
                <Link
                  href={`/services/${service.id}`}
                  className="carousel-card-link"
                  onClick={handleCardClick}
                >
                  <div className={`service-art service-art-${art} carousel-card-art`}>
                    <div className="service-card-meta">
                      <span className="eyebrow">{t(service.tag)}</span>
                      <span className="service-symbol" aria-hidden="true">
                        {symbols[art] ?? "✦"}
                      </span>
                    </div>
                  </div>
                  <div className="service-card-body">
                    <span className="service-category">
                      {t(category?.name ?? "Élite Club")}
                    </span>
                    <div className="service-card-title">
                      <h3>{t(service.name)}</h3>
                    </div>
                    <p>{t(service.description)}</p>
                    <div className="service-card-price">
                      <span>
                        <strong>{formatMoney(service.price)}</strong>
                        <small> / {t(service.chargeType === "por_persona" ? "persona" : "hora")}</small>
                      </span>
                      <span className="carousel-card-action">
                        {t("Reservar")}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      {services.length > 1 && (
        <div className="carousel-dots" role="tablist" aria-label="Indicadores de carrusel">
          {services.map((service, idx) => (
            <button
              key={service.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Ir al espacio ${idx + 1}`}
              className={`carousel-dot ${idx === activeIndex ? "active" : ""}`}
              onClick={() => scrollToIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

