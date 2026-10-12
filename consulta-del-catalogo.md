# HU-20: Consulta del Catálogo de Servicios

Documentación técnica de los cambios realizados en el marco de la historia de usuario **HU-20: Consulta del catálogo de servicios** (rama: `jonathan-feature/HU-20/Consulta-del-catalogo-de-servicios`).

---

## 1. Resumen de Cambios

Se realizó la configuración del sistema de diseño base en el archivo global de estilos (`src/app/globals.css`), estableciendo la paleta de colores corporativa, variables CSS personalizadas, utilidades de Glassmorphism, barra de navegación personalizada y transiciones suaves para la presentación del catálogo de servicios.

---

## 2. Paleta de Colores y Variables de Diseño (`:root`)

Se implementó la paleta **Elite Club - Grises Carbón y Azul Tecnológico**, diseñada para una interfaz oscura, moderna y deportiva de alto rendimiento:

| Variable CSS | Valor | Propósito / Uso |
| :--- | :--- | :--- |
| `--bg-base` | `#141618` | Color de fondo principal de la aplicación (carbón oscuro). |
| `--bg-surface` | `#1A1D20` | Superficies, tarjetas de servicios y contenedores secundarios. |
| `--glass-bg` | `rgba(26, 29, 32, 0.75)` | Fondo translúcido para paneles con efecto de vidrio. |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | Borde sutil para resaltar contenedores translúcidos. |
| `--accent-blue` | `#0085FF` | Color de acento primario (botones, enlaces, tags destacados). |
| `--accent-blue-hover`| `#006FCC` | Estado hover para elementos interactivos en azul. |
| `--text-primary` | `#FFFFFF` | Texto principal de alto contraste y legibilidad. |
| `--text-secondary` | `#94A3B8` | Texto secundario, descripciones breves, subtítulos y precios. |
| `--transition-smooth`| `all 0.6s cubic-bezier(0.16, 1, 0.3, 1)` | Curva de animación suave para interacciones y scroll. |

---

## 3. Estilos Globales Implementados (`src/app/globals.css`)

### 3.1 Estilos Base del `body`
* **Fondo y Texto**: Se enlaza `--bg-base` y `--text-primary` por defecto.
* **Tipografía**: Pila de fuentes del sistema moderna (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
* **Control de desbordamiento**: `overflow-x: hidden` para evitar scroll horizontal no deseado.

### 3.2 Scrollbar Personalizada
Barra de desplazamiento discreta y estilizada acorde al tema oscuro:
* Ancho reducido a `6px`.
* Fondo integrado con `--bg-base`.
* Tirador (thumb) translúcido con bordes redondeados (`border-radius: 3px`).
* Estado hover resaltado con el color de acento `--accent-blue`.

### 3.3 Utilidad de Glassmorphism (`.glass-panel`)
Clase utilitaria para contenedores flotantes, filtros y tarjetas de catálogo:
```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
}
```

### 3.4 Animación de Scroll Natural (`.scroll-reveal`)
Efecto de aparición suave (fade-in y elevación) ideal para renderizar los elementos y tarjetas al navegar por el catálogo:
```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: var(--transition-smooth);
}

.scroll-reveal.active {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 4. Guía de Uso en los Componentes del Catálogo

### Ejemplo de Tarjeta de Servicio con Glassmorphism
```tsx
<div className="glass-panel rounded-xl p-5 hover:border-(--accent-blue) transition-all">
  <h3 className="text-(--text-primary) font-semibold text-lg">Cancha Sintética de Fútbol 5</h3>
  <p className="text-(--text-secondary) text-sm mt-2">
    Cancha de césped sintético de alta calidad con iluminación LED nocturna.
  </p>
  <div className="mt-4 flex justify-between items-center">
    <span className="text-(--accent-blue) font-bold">$70.000 / hora</span>
    <button className="bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white px-4 py-2 rounded-lg text-sm transition-colors">
      Reservar
    </button>
  </div>
</div>
```

---

## 5. Archivos Afectados
* `src/app/globals.css` (Modificado con paleta de colores y estilos globales).
* `README.md` (Sin modificaciones, preservado intacto).
