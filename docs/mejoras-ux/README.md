# Mejoras de experiencia y seguridad · Élite Club

Rama de integración: `Nicolas-test/Mejoras-UX-integracion` → PR hacia `develop`.
Origen: la auditoría de UX y el plan de `docs/CONTEXTO-TECNICO-MEJORAS.md` (olas 0 a 4). **Storage y carrusel no se incluyen:** esperan la confirmación de la propuesta (§11 de ese documento) y la creación de los buckets y la clave en Supabase.

## Resumen

| # | Cambio | Para quién | Rama |
|---|---|---|---|
| 0 | El login ya no se cae con Turnstile configurado | Todos | `Nicolas-fix/PEDG-21/Turnstile-ssr` (también es el PR #15) |
| 0 | Next 16.3.6 → **16.3.8** (parche de seguridad) | Todos | `Nicolas-chore/Next-16.3.8` |
| 1 | Ver u ocultar la contraseña en los 6 campos | Todos | `Nicolas-feature/UX/Mostrar-contrasena` |
| 1 | **Un solo botón de Wompi**; el pago demo pasa a ser discreto | Cliente | `Nicolas-feature/PEDG-35/Boton-unico-Wompi` |
| 1 | **PEDG-23:** la recuperación de contraseña ahora sí funciona | Todos | `Nicolas-fix/PEDG-23/Recuperacion-contrasena` |
| 1 | Cambiar la contraseña cierra las demás sesiones | Todos | `Nicolas-fix/PEDG-23/Ajustes-verificador` |
| 2 | Superficies más claras, tokens de estado y acento secundario | Todos | `Nicolas-feature/UX/Paleta-superficies` |
| 3 | Navegación por rol, pestañas de admin compartidas y **perfil** | Todos | `Nicolas-feature/UX/Navegacion-por-rol` |
| 4 | Textos legibles en móvil (mínimo 10 px) | Todos | `Nicolas-feature/UX/Responsive-movil` |
| — | Ajustes de la revisión independiente | Todos | `Nicolas-fix/UX/Ajustes-verificador-2` |

Validación de la rama integrada:
- `lint` sin errores (quedan 2 advertencias heredadas), `typecheck` y `build` en verde.
- Regresión por rol completa.
- Capturas en 360, 390 y 1280 px sin desborde horizontal.
- Dos revisiones independientes.
- No se escribió nada en la base compartida.

---

## 0. Login caído con Turnstile y actualización de Next

- **Problema:** con las claves de Turnstile, `/login` y `/register` daban 500 (`window is not defined`). El widget leía `window` durante el render en el servidor.
- **Arreglo:** `src/features/auth/components/turnstile-widget.tsx`, una línea.
- **Next 16.3.8:** corrige las vulnerabilidades altas de Next (incluida una de caché en modo self-hosted). Las versiones se mantienen fijas (sin `^`). Prisma no se toca.
- **Probar:** con las claves de Turnstile en `.env`, `/login` y `/register` cargan y muestran el captcha.

## 1. Ver u ocultar la contraseña

- **Componente nuevo:** `src/shared/components/password-input.tsx`. Recibe las mismas propiedades que un `<input>`; el botón tiene `aria-pressed`, etiqueta traducida y nunca envía el formulario.
- **Dónde está:** login, registro (contraseña y confirmación), restablecer, perfil y alta / cambio de contraseña de empleados.
- **Probar:** en `/login`, el ícono del ojo muestra y oculta la contraseña sin enviar el formulario.

## 2. Un solo botón de Wompi (PEDG-35)

- **Antes:** había que pulsar "Pagar en línea con Wompi", luego aparecía "Continuar al checkout seguro", entre avisos.
- **Ahora:**
  - Un solo botón, **"Pagar con Wompi"**. Crea o reutiliza el `Pago` pendiente y lleva directo al checkout de Wompi.
  - Si el navegador bloquea la redirección, aparece el enlace "Si no se abre, continúa aquí".
  - El botón queda bloqueado mientras redirige y se desbloquea si el usuario vuelve con "atrás".
  - El pago demo pasó a un desplegable: "¿Problemas con Wompi? Usar el pago de prueba".
- **No cambió:** los campos que se envían a Wompi ni la firma de integridad.
- **Archivos:**
  - `src/features/payments/components/wompi-payment-button.tsx`
  - `src/features/reservations/components/demo-payment-button.tsx` (variante `secondary`)
  - `src/app/(client)/checkout/[reservationId]/page.tsx`
- **Probar (escribe en la base):**
  1. Reservar un turno como cliente.
  2. En el checkout, pulsar "Pagar con Wompi".
  3. Con claves sandbox, el navegador abre `checkout.wompi.co`; sin claves, aparece el aviso y el pago demo dentro del desplegable.

## 3. Recuperación de contraseña (PEDG-23)

- **Bug:** el formulario cambiaba la contraseña en Supabase Auth, pero el login valida `Usuario.contrasena_hash`, así que la clave nueva nunca servía.
- **Cómo funciona ahora** (sin tablas nuevas):
  1. `/forgot-password` envía un correo (Resend) con un enlace firmado con HMAC (`SESSION_SECRET`) que vence en **30 minutos**.
  2. El enlace es de **un solo uso**: incluye una huella del hash actual, así que deja de servir en cuanto cambia la contraseña.
  3. `/reset-password` valida el enlace en el servidor. Si no sirve, muestra "El enlace no es válido o ya venció" con un enlace para pedir otro.
  4. Al restablecer, se guarda `contrasena_hash` (scrypt), se confirma el correo y se borra el código OTP pendiente.
- **Seguridad:**
  - La respuesta es la misma para correos registrados y desconocidos, y el correo sale después de responder (`after()`), así que tampoco se distingue por el tiempo.
  - Turnstile se exige cuando está configurado.
- **Archivos:**
  - `src/features/auth/services/password-reset.service.ts`
  - `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`
  - `src/features/auth/services/auth.service.ts`, `src/features/auth/components/password-reset-form.tsx`
  - `src/app/(auth)/reset-password/page.tsx`
- **Probar (escribe en la base y envía un correo real):**
  1. En `/forgot-password`, escribir el correo de una cuenta propia (las cuentas demo `@eliteclub.demo` no reciben correo).
  2. Abrir el enlace del correo y guardar una contraseña nueva.
  3. Iniciar sesión con la nueva: entra. Con la anterior: no entra.
  4. Volver a abrir el mismo enlace: muestra "El enlace no es válido o ya venció".

## 4. Cambiar la contraseña cierra las demás sesiones

- **Cómo:** la cookie de sesión ahora lleva una huella del hash de la contraseña (`pv`). Si la contraseña cambia por cualquier vía (enlace de recuperación, perfil o admin a un empleado), las sesiones anteriores dejan de valer.
- **Compatibilidad:** las cookies emitidas antes de este cambio, que no tienen huella, siguen valiendo hasta que vencen (14 días). Así nadie pierde la sesión al desplegar.
- **No agrega consultas a la base:** se comprueba en la misma lectura del usuario que ya se hacía en cada petición.
- **Archivos:** `src/features/auth/lib/session.ts`, `src/features/auth/lib/password.ts` (`passwordFingerprint`).
- **Verificado:**
  - un login nuevo funciona;
  - una cookie vieja sigue valiendo;
  - una cookie con huella falsa vuelve a `/login`.

## 5. Paleta: superficies más claras

- **Se mantiene el tema oscuro y el azul de marca.** Solo se aclaran las superficies:
  - `--bg-surface #1a2232`
  - `--glass-bg rgb(30 39 56 / 84%)`
  - bordes al 13 %
  - texto secundario `#a9b6c8`
- **Tokens nuevos:** `--surface-raised`, `--surface-header`, `--surface-input`, `--accent-secondary` (verde azulado), `--color-success`, `--color-warning` y `--color-danger`.
- **Contraste verificado (WCAG AA ≥ 4.5:1):** texto principal 14.9; secundario 7.7; acento 7.4; estados entre 5.7 y 9.4.
- **Archivo:** `src/app/globals.css`.

## 6. Navegación por rol y perfil

- **Barra inferior móvil:** un destino por ítem, como máximo 5, y un solo ítem activo.

  | Rol | Ítems |
  |---|---|
  | Invitado | Inicio · Espacios · Entrar |
  | Cliente | Inicio · Espacios · Reservas · Perfil |
  | Empleado | Actividad · Escanear · Perfil |
  | Admin | Panel · Catálogo · Agenda · Equipo · Perfil |

- **Header de escritorio:** enlaces por rol con la sección activa marcada.
- **Header móvil:** pasa a una fila flexible. El nombre de la empresa no baja de 10–13 px (antes llegaba a 7 px) y el menú de cuenta muestra solo el avatar.
- **Menú de cuenta:** "Mi perfil", el acceso a la sección del rol y "Cerrar sesión", cada uno con su propio destino.
- **Pestañas de admin:** ahora son un único componente (`src/shared/components/admin-tabs.tsx`) en lugar de 5 copias.
- **Perfil (`/profile`, cualquier rol):**
  - Muestra nombre, correo, rol, servicio asignado (empleados), forma de acceso, si el correo está confirmado y la fecha de alta.
  - Permite cerrar sesión.
  - Permite **cambiar la contraseña** pidiendo la actual. Las cuentas de Google o GitHub pueden crear su primera contraseña. Al cambiarla se cierran las otras sesiones y el dispositivo actual sigue conectado.
- **Archivos:**
  - `src/shared/components/mobile-bottom-nav.tsx`, `header-nav.tsx`, `site-header.tsx`, `user-menu-dropdown.tsx`, `admin-tabs.tsx`
  - `src/app/(account)/`
  - `src/features/auth/services/account.service.ts`, `src/features/auth/api/profile.actions.ts`
  - `src/features/auth/components/change-password-form.tsx`, `logout-button.tsx`
- **Probar:**
  1. Entrar con cada cuenta demo y revisar la barra inferior en móvil: un solo ítem activo.
  2. Abrir `/profile`.
  3. Cambiar la contraseña y comprobar que el mismo navegador sigue con sesión. **Escribe en la base:** después, volver a dejar la contraseña demo original.

## 7. Responsive

- **Textos de 7 a 9 px** (fechas, etiquetas de tarjetas, ayudas): suben a 10–11 px. Los valores del gráfico de ingresos se quedan en 8 px en móvil para que no se solapen.
- **Revisado con capturas de Chrome sin interfaz** en 360, 390 y 1280 px de: inicio, login, detalle de servicio, mis reservas, perfil, métricas, servicios, empleados, panel del empleado y checkout. **Sin desborde horizontal.**
- En celulares muy chicos (≤ 340 px), el selector "Iniciar sesión / Registrarse" se ajustó para que no se corte.

---

## Antes de fusionar: pruebas manuales que escriben en la base

- [ ] Recuperación de contraseña de punta a punta con un correo propio (§3).
- [ ] Pago con Wompi sandbox: un solo clic abre el checkout (§2).
- [ ] Cambio de contraseña desde el perfil y restaurar después la contraseña demo (§6).
- [ ] Cámara del escáner y descarga de PDF en un celular real (no lo cubren las capturas).

## Pendientes conocidos

- **Storage y carrusel:** pendientes de confirmar la propuesta y de crear los buckets y la clave en Supabase.
- **`/verify-email`:** todavía no está traducida y usa el diseño viejo `sport-*`.
- **`/camera-test`:** sigue pública.
- **Lint:** 2 advertencias heredadas (`cyan` sin uso y una dependencia de hook en el escáner).
- **Cookies anteriores al despliegue:** no tienen huella de contraseña y siguen valiendo hasta 14 días.
- **Correo de recuperación:** solo en español.
- **Límite de intentos:** no hay límite para adivinar la contraseña actual en el perfil. Se mitiga porque exige una sesión activa y scrypt es lento.

## Texto sugerido para el PR

> **feat(ux): navegación por rol, perfil, recuperación de contraseña y botón único de Wompi**
>
> - Arregla el login caído con Turnstile y actualiza Next a 16.3.8.
> - Botón para ver u ocultar la contraseña en todos los formularios.
> - Pago con un solo botón de Wompi; el pago demo queda como respaldo.
> - PEDG-23: la recuperación de contraseña funciona con enlaces firmados de un solo uso, y cambiar la contraseña cierra las demás sesiones.
> - Superficies más claras con contraste AA, navegación por rol sin destinos duplicados, pestañas de admin compartidas y página de perfil.
> - Textos legibles en móvil.
>
> Detalle y pruebas en `docs/mejoras-ux/README.md`.
