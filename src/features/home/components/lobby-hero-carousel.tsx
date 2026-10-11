"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  src: string;
  alt: string;
};

// Reemplaza estos enlacespor las imágenes de tus espacios cuando las tengas.
const slides: HeroSlide[] = [
  {
    src: "https://images.unsplash.com/photo-1728486145245-d4cb0c9c3470?auto=format&fit=crop&w=2200&q=85",
    alt: "Gimnasio moderno con máquinas de entrenamiento",
  },
  {
    src: "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=2200&q=85",
    alt: "Piscina de natación cubierta con carriles",
  },
  {
    src: "https://images.unsplash.com/photo-1559369064-c4d65141e408?auto=format&fit=crop&w=2200&q=85",
    alt: "Cancha cubierta de baloncesto",
  },
];

const configuredSlides = slides.filter((slide) => slide.src.trim().length > 0);

export function LobbyHeroCarousel() {
  const [slideState, setSlideState] = useState<{ active: number; previous: number | null }>({
    active: 0,
    previous: null,
  });
  const [isPaused, setIsPaused] = useState(false);
  const activeIndex = slideState.active;

  useEffect(() => {
    if (configuredSlides.length < 2 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalId = window.setInterval(() => {
      setSlideState((current) => ({
        active: (current.active + 1) % configuredSlides.length,
        previous: current.active,
      }));
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  useEffect(() => {
    if (slideState.previous === null) return;

    const transitionTimeout = window.setTimeout(() => {
      setSlideState((current) => ({ ...current, previous: null }));
    }, 1500);

    return () => window.clearTimeout(transitionTimeout);
  }, [slideState.previous]);

  if (configuredSlides.length === 0) return null;

  const activeSlide = configuredSlides[activeIndex];
  const visibleSlides = slideState.previous === null
    ? [{ slide: activeSlide, index: activeIndex, state: "is-active is-initial" }]
    : [
        { slide: configuredSlides[slideState.previous], index: slideState.previous, state: "is-leaving" },
        { slide: activeSlide, index: activeIndex, state: "is-active is-entering" },
      ];

  return (
    <div
      className={`lobby-hero-carousel${isPaused ? " is-paused" : ""}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Espacios deportivos"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      {visibleSlides.map(({ slide, index, state }) => (
        // Enlaces externos directos: no requieren configuración de dominios.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.src}
          className={`lobby-hero-carousel-media ${state}`}
          src={slide.src}
          loading="eager"
          decoding="async"
          alt={state === "is-active" ? slide.alt : ""}
          aria-hidden={state !== "is-active"}
          fetchPriority={index === 0 ? "high" : "auto"}
        />
      ))}
    </div>
  );
}
