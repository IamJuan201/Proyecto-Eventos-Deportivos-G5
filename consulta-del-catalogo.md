# Bitácora Técnica de Desarrollo: Proyecto Élite Club

Este documento registra de manera integral y cronológica todos los avances, refactorizaciones y características desarrolladas en el proyecto **Élite Club - Eventos Deportivos**, sirviendo como registro de cambios (Changelog) y guía técnica tanto de lo ejecutado previamente como de las sesiones presentes y futuras.

---

## 📌 Tabla de Contenidos
1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Sprint 1: Base de Diseño y Catálogo de Servicios (HU-20)](#1-sprint-1-base-de-diseño-y-catálogo-de-servicios-hu-20)
3. [Sprint 2: Hero Section, Identidad Visual y Responsive Navbar / Footer](#2-sprint-2-hero-section-identidad-visual-y-responsive-navbar--footer)
4. [Sprint 3: Normalización de Botones y Paleta Azul Cielo](#3-sprint-3-normalización-de-botones-y-paleta-azul-cielo)
5. [Sprint 4: Módulo de Autenticación, OAuth y Navbar de Usuario](#4-sprint-4-módulo-de-autenticación-oauth-y-navbar-de-usuario)
6. [Resumen de Archivos y Componentes Clave](#5-resumen-de-archivos-y-componentes-clave)
7. [Convención para Documentar Cambios Futuros](#6-convención-para-documentar-cambios-futuros)

---

## Visión General del Proyecto
* **Framework:** Next.js 16 (App Router con Turbopack) & React 19.
* **Lenguaje:** TypeScript (estricto).
* **Estilos:** Tailwind CSS v4 con variables CSS personalizadas para tema oscuro atlético.
* **Base de Datos / Persistencia:** Prisma ORM, Supabase Auth / SSR y tienda demo local para sprints ágiles.
* **Identidad Visual:** Tema oscuro cinematográfico (`#0b0f15`, `#121824`), con acento corporativo **Azul Cielo** (`#0ea5e9` / `#38bdf8`), bordes sutiles y efectos Glassmorphism translúcidos.

---

## 1. Sprint 1: Base de Diseño y Catálogo de Servicios (HU-20)
* **Objetivo:** Establecer el sistema de diseño base en `src/app/globals.css` y la navegación del catálogo de servicios deportivos.
* **Cambios realizados:**
  - Definición de tokens y variables `:root` (`--bg-base`, `--bg-surface`, `--glass-bg`, `--glass-border`, `--transition-smooth`).
  - Creación de clases de utilidad para Glassmorphism (`.glass-panel`) con `backdrop-filter: blur(16px)`.
  - Estructuración de tarjetas de servicios (`ServiceCard`) con tags de categoría, símbolos visuales deportivos (`〰`, `≈`, `≋`, `✦`, etc.), cálculo dinámico de precios (por persona / por hora) y modal/vista de detalle por servicio (`/services/[serviceId]`).
  - Sistema de animaciones sutiles con `.club-card-hover` y scroll suave en el documento.

---

## 2. Sprint 2: Hero Section, Identidad Visual y Responsive Navbar / Footer
* **Objetivo:** Crear un Hero impactante con imagen de fondo, optimizar la experiencia responsive y unificar la barra de navegación y el pie de página.
* **Cambios realizados:**
  - **Hero Banner Centrado:**
    - Generación e integración de imagen de alta resolución de complejo deportivo nocturno (`/public/images/hero-bg.jpg`).
    - Banner estructurado con pseudo-elementos `::before` y `::after` para aplicar un degradado oscuro semi-transparente que no opaque el texto.
    - Tipografía grande y centrada con título: *"Tu próximo gran momento empieza aquí"*.
  - **Nuevo Icono y Logo:**
    - Integración del logotipo oficial del club (letra **E** estilizada con punto de acento en azul cielo) en `/public/images/logo.png` y favicon `/src/app/icon.png`.
  - **Barra de Progreso de Lectura para PC (`ScrollProgressBar`):**
    - Componente cliente en `src/shared/components/scroll-progress-bar.tsx`.
    - Rastreo de scroll optimizado con `requestAnimationFrame` que llena una línea azul degradada en la parte inferior del navbar mientras se navega hacia abajo.
  - **Navbar Sticky:**
    - Cabecera fija (`position: sticky; top: 0; z-index: 50`) con efecto blur que acompaña al usuario durante todo el desplazamiento.
  - **Barra Inferior Móvil (`MobileBottomNav`):**
    - En pantallas celulares (`max-width: 640px`), las opciones de navegación principales se trasladan a una barra fija inferior ergonómica para pulgar.
    - Opciones adaptativas según el rol del usuario (Cliente, Empleado o Administrador).
  - **Depuración del Footer (`SiteFooter`):**
    - Se eliminaron los enlaces duplicados que repetían la navegación del navbar.
    - Reorganización en cuadrícula de 3 columnas: Marca/Identidad, Horarios del complejo e Información de contacto.

---

## 3. Sprint 3: Normalización de Botones y Paleta Azul Cielo
* **Objetivo:** Refinar la interfaz eliminando flechas duras en botones y adoptando la paleta de color Azul Cielo (`sky blue`).
* **Cambios realizados:**
  - **Actualización de Paleta:**
    - `--accent-blue`: Actualizado a `#0ea5e9` (Sky Blue 500).
    - `--accent-blue-hover`: Actualizado a `#38bdf8` (Sky Blue 400).
    - `--accent-sky`: Introducido con `#38bdf8`.
  - **Rediseño de `.club-button`:**
    - Eliminado `text-transform: uppercase` agresivo.
    - Tipografía más suave (`font-weight: 600`, `letter-spacing: 0.02em`).
    - Degradado moderno de azul cielo `linear-gradient(135deg, #0ea5e9, #0284c7)` con sombra difusa.
    - Versión secundaria con vidrio esmerilado y borde celeste translúcido.
  - **Limpieza de Caracteres Flecha:**
    - Eliminadas las flechas `↗` y `→` de todos los botones de la interfaz:
      - Botón del hero *"Explorar espacios"*.
      - Botón de login en el header.
      - Título de las tarjetas de servicio.
      - Botón de submit en el formulario de reserva (`BookingForm`).
      - Botón de confirmación de pago de prueba (`DemoPaymentButton`).
      - Enlaces de estado en *"Mis reservas"*.

---

## 4. Sprint 4: Módulo de Autenticación, OAuth y Navbar de Usuario
* **Objetivo:** Crear una pantalla de inicio de sesión premium, moderna y translúcida, junto con un sistema de usuario autenticado en la barra de navegación.
* **Cambios realizados:**
  - **Botones OAuth en la Parte Superior (`OAuthButtons.tsx`):**
    - Botones dedicados para **Google** y **GitHub** ubicados al inicio del formulario.
    - Iconos SVG limpios y fieles a las marcas oficiales (Google multicolor y GitHub vectorizado).
    - Bordes sutiles `border-gray-300/25`, esquinas redondeadas `rounded-lg`, fondo translúcido y hover suave con halo azul cielo.
    - Se eliminó el texto de advertencia inferior para una interfaz más despejada y minimalista.
  - **Divisor Central con la Palabra `"or"`:**
    - Separador visual estilizado con línea tenue y badge en píldora con `backdrop-blur`.
  - **Campos del Formulario Tradicional:**
    - Entradas de `Email o Username` y `Password`.
    - Estilizado de inputs con fondo translúcido oscuro, bordes sutiles y anillo de enfoque en azul cielo.
    - Enlace *"¿Olvidaste tu contraseña?"* en color blanco/slate suave con transición hover al azul cielo del club.
  - **Tarjeta de Login Centrada y Fondo Cinematográfico:**
    - Se centró la tarjeta de login en pantalla tanto para PC como para dispositivos móviles.
    - Se eliminó el panel explicativo de la izquierda para lograr una vista limpia, enfocada y directa.
    - Se eliminaron los textos de cuentas de prueba que sobrecargaban la vista.
    - Enlace *"Regístrate aquí"* estilizado en blanco con efecto hover azul cielo.
    - Fondo de pantalla utilizando la imagen nocturna del club (`hero-bg.jpg`) con capa translúcida oscura y efecto blur.
  - **Header Dinámico (Estado de Sesión):**
    - **Usuario No Logueado:** Muestra dos botones limpios en el navbar:
      1. *"Iniciar sesión"* (texto sutil con hover celeste).
      2. *"Registrarse"* (botón en píldora blanco de alto contraste con hover azul cielo).
    - **Usuario Logueado (`UserMenuDropdown.tsx`):**
      - Muestra el nombre del usuario en texto blanco legible.
      - Avatar circular con la inicial del usuario sobre un gradiente azul cielo.
      - Menú desplegable interactivo al hacer clic, con acceso directo a reservas/panel según rol y botón para **Cerrar sesión**.

---

## 5. Resumen de Archivos y Componentes Clave

| Archivo / Componente | Propósito |
| :--- | :--- |
| `src/app/globals.css` | Variables de diseño, scroll progress, responsive queries y reglas maestras. |
| `src/app/(auth)/login/page.tsx` | Página de login centrada con fondo hero-bg y tarjeta translúcida. |
| `src/features/auth/components/auth-forms.tsx` | Componentes `LoginForm` y `RegisterForm` con lógica de envío y feedback. |
| `src/features/auth/components/OAuthButtons.tsx` | Botones superiores OAuth para Google y GitHub. |
| `src/shared/components/site-header.tsx` | Barra de navegación superior con soporte de sesión dinámica. |
| `src/shared/components/user-menu-dropdown.tsx` | Componente de usuario autenticado con avatar y menú desplegable. |
| `src/shared/components/scroll-progress-bar.tsx` | Barra de lectura animada en la parte superior. |
| `src/shared/components/mobile-bottom-nav.tsx` | Barra de navegación fija inferior para dispositivos móviles. |
| `src/shared/components/site-footer.tsx` | Pie de página depurado de tres columnas. |

---

## 6. Convención para Documentar Cambios Futuros

Cada vez que se efectúe una modificación o nueva funcionalidad en el proyecto, se debe agregar una nueva sección bajo la siguiente estructura:

```markdown
### Sprint X: [Nombre de la Característica / Modificación]
* **Fecha:** [DD/MM/AAAA]
* **Objetivo:** [Breve descripción de la necesidad del usuario o requerimiento técnico]
* **Cambios realizados:**
  - [Detalle de cambios en componentes, estilos o lógica]
* **Archivos afectados:**
  - `ruta/al/archivo.tsx`
* **Pruebas y Verificación:** [typecheck, lint, build, pruebas funcionales]
```
