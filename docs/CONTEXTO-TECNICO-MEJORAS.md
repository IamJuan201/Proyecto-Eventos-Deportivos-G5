# Contexto técnico para orquestar las mejoras de Élite Club

> **Estado al 10/10/2026:** las olas 0 a 4 (§7) están implementadas en la rama `Nicolas-test/Mejoras-UX-integracion`. El detalle y las pruebas están en `docs/mejoras-ux/README.md`. Quedan pendientes Storage y carrusel (ola 5), a la espera de confirmar la propuesta de §11.

**Uso de este documento:** dárselo al asistente que redacta los prompts de los agentes. Reúne lo que un agente necesita saber del proyecto para trabajar sin romper nada. Toda la información sale de `develop` (`b93d3fc`, 10/10/2026); cuando el código y este documento no coincidan, manda el código.

Fuente de las mejoras: `auditoria.md` (navegación por rol, perfil, responsive, paleta, Supabase Storage y carrusel). A eso se suman dos pedidos puntuales: **mostrar u ocultar la contraseña en el login** y **arreglar los botones de pago con Wompi**.

---

## 1. El proyecto en pocas líneas

Élite Club es una plataforma de reservas para un complejo deportivo (canchas, piscina, gimnasio). El flujo es: registro o login → catálogo → reservar un turno → pagar (Wompi en sandbox o pago demo) → recibir códigos QR → el empleado escanea el QR en la entrada → el admin ve las métricas.

Hay tres roles: **cliente**, **empleado** (escanea los QR de un servicio asignado) y **admin** (catálogo, horarios, empleados y métricas).

Equipo de 7 personas, gestionado en Jira (proyecto **PEDG**, sitio `iamjuan201.atlassian.net`). El Sprint 2 termina el lunes 12/10/2026, que es festivo.

---

## 2. Stack

| Capa | Tecnología | Nota para los agentes |
|---|---|---|
| Framework | **Next.js 16.3.6**, App Router, React 19.2, React Compiler | **No es el Next que conocen.** Antes de escribir código hay que leer la guía en `node_modules/next/dist/docs/` (lo exige `AGENTS.md`). El middleware se llama `src/proxy.ts`. |
| Lenguaje | TypeScript estricto | `npm run typecheck` debe quedar en verde. |
| Estilos | Tailwind v4 y clases propias en `src/app/globals.css` (818 líneas) | El sistema visual vive en clases como `club-container`, `glass-panel`, `club-button` y `club-input`, no en utilidades Tailwind sueltas. |
| Datos | **Prisma 7** + adaptador `pg` sobre **PostgreSQL de Supabase (base compartida)** | Cliente en `src/shared/lib/prisma.ts` (`getPrisma()`); el cliente generado vive en `src/generated/prisma`. |
| Auth | Propia: hash scrypt y cookie HMAC de 14 días (`src/features/auth/lib/session.ts`) | Supabase Auth solo se usa para Google/GitHub y la recuperación de contraseña. |
| Pagos | Wompi sandbox (widget de checkout y webhook firmado) + pago demo de respaldo | `src/features/payments/`, `src/shared/lib/wompi.ts`, `src/app/api/wompi/*`. |
| Correo | Resend | `src/shared/lib/email.ts`. Sin la clave, los correos se registran en consola y se omiten. |
| Seguridad | Cloudflare Turnstile en login y registro; OTP de 8 dígitos para verificar el correo | Turnstile solo se exige si existe `TURNSTILE_SECRET_KEY`. |
| QR y PDF | `qrcode`, `html5-qrcode` (escáner), `jspdf`, `jspdf-autotable`, `canvg`, `@office-kit/xlsx` | Tickets QR en PDF y reportes de métricas en PDF/XLS. |
| i18n | Español e inglés con un diccionario propio | Ver §3.4. |
| Despliegue | Vercel (previews por rama); VPS planificado (PEDG-40) | Vercel ya corre un despliegue de vista previa para cada PR. |

Comandos:

```bash
npm install          # obligatorio tras cada pull: hay dependencias nuevas
npm run lint         # 0 errores (hoy quedan 2 advertencias heredadas)
npm run typecheck
npm run build        # incluye prisma generate
```

No hay framework de pruebas automáticas. Cada HU se valida a mano y se documenta.

---

## 3. Arquitectura del código

### 3.1 Rutas (`src/app`, con route groups)

| Grupo | Rutas | Protección |
|---|---|---|
| `(public)` | `/`, `/services`, `/services/[serviceId]` | Pública; el formulario de reserva solo aparece para clientes. |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Pública. |
| `(client)` | `/my-reservations`, `/checkout/[reservationId]` | `layout.tsx` exige el rol cliente. |
| `(employee)` | `/employee`, `/scanner` | `layout.tsx` exige el rol empleado **y** que esté activo. |
| `(admin)` | `/admin/metrics`, `/admin/categories`, `/admin/services`, `/admin/schedules`, `/admin/employees` | `layout.tsx` exige el rol admin. |
| `api` | `auth/*`, `wompi/webhook`, `wompi/return`, `cron/expire-reservations`, `admin/metrics/export`, `locale` | Cada ruta valida por su cuenta. |
| `camera-test` | Página de pruebas | **Pública por error.** Hay que retirarla o protegerla. |

**No existe ninguna ruta de perfil.**

### 3.2 Organización por feature (`src/features/<feature>/`)

```
api/          Server Actions ("use server"): validan el rol con requireRole() y llaman al servicio
services/     lógica de negocio y acceso a datos (import "server-only")
components/   UI de la feature
types/        tipos
```

Features: `access-control`, `auth`, `categories`, `employees`, `metrics`, `payments`, `reservations`, `schedules` y `services`. Lo compartido vive en `src/shared/` (`components/`, `lib/`, `i18n/`).

**Patrón obligatorio en las acciones de admin:**
1. `await requireRole("admin")` al inicio de cada Server Action.
2. La validación va en el servicio de la feature.
3. Los errores vuelven como texto para mostrarlo en la UI.

### 3.3 Navegación (lo que más toca la auditoría)

| Archivo | Qué hace hoy |
|---|---|
| `src/shared/components/site-header.tsx` | Header único para todos los roles. Arma los enlaces según el rol y calcula `accountPath`: admin → `/admin/metrics`, empleado → `/employee`, cliente → `/my-reservations`, invitado → `/login`. |
| `src/shared/components/mobile-bottom-nav.tsx` | Barra inferior móvil, con ítems por rol más un botón "Cuenta" que apunta a `accountPath`. |
| `src/shared/components/user-menu-dropdown.tsx` | Menú de cuenta de escritorio: enlace a `accountPath` y cerrar sesión. |
| `src/shared/components/guest-header-controls.tsx`, `language-switcher.tsx` | Controles del invitado y selector de idioma. |
| `admin-tabs` | Las pestañas del panel admin están **copiadas a mano en 7 páginas** distintas. |

**Causa del problema "dos botones seleccionados":** el botón "Cuenta" lleva al mismo destino que otro ítem de la barra. Para el admin, "Cuenta" y "Panel" van los dos a `/admin/metrics`; para el cliente, "Cuenta" y "Mis reservas" van los dos a `/my-reservations`. Como ambos ítems coinciden con la ruta actual, los dos se marcan como activos.

### 3.4 i18n

- **Servidor:** `const locale = await getLocale()` (`@/shared/i18n/locale.server`) y `translate(texto, locale)`.
- **Cliente:** `const t = useTranslate()` (`@/shared/i18n/locale-provider`).
- **Diccionario:** `src/shared/i18n/messages.ts`. La clave es el texto en español; si no hay traducción, se muestra el español. Tiene varios objetos (`english`, `extraEnglish`, `featureEnglish`).
  - **Las claves duplicadas rompen el typecheck.** Antes de agregar una, hay que buscarla con comillas simples **y** dobles.
- El idioma se guarda en la cookie `elite-locale` mediante `POST /api/locale`.
- **Todavía sin traducir:** `/verify-email`, `verify-email-form.tsx`, `wompi-payment-button.tsx` y el error inicial de OAuth del login.

### 3.5 Diseño actual

- **Paleta** (`:root` en `globals.css`): fondo `#0b0f15`, superficie `#121824`, vidrio `rgb(18 24 36 / 78%)`, acento `#0ea5e9` / `#38bdf8`, texto `#f7f9fc` / `#94a3b8`, y `color-scheme: dark`.
  - No hay tokens de estado (éxito, alerta, error) ni un tema claro.
  - El azul se usa para casi todo.
- **Tokens viejos `--color-sport-*`** (verde): siguen en uso en `auth-forms.tsx`, `OAuthButtons.tsx`, `verify-email/page.tsx` y `verify-email-form.tsx`. Si alguien los borra sin migrar esas pantallas, pierden los estilos.
- **Responsive:** solo 8 bloques `@media` (casi todos `max-width: 640px`).
- **Imágenes:** los servicios usan `Servicio.imagenUrl` (texto), que el admin pega como URL en `ServiceForm.tsx`.
  - Ilustraciones de respaldo con `Servicio.icono` (water, waves, court…).
  - `next.config.ts` no define `images.remotePatterns`.
- **Portada:** `src/app/page.tsx` es un hero estático (`lobby-hero`); no hay carrusel.

---

## 4. Datos

- **Base compartida en Supabase.** La usa todo el equipo y Vercel.
  - **Prohibido** correr `prisma migrate dev`, `db push`, `migrate reset` o el seed completo contra ella. El seed sobrescribe las filas con los datos del archivo.
  - Las migraciones nuevas se crean en la rama, se revisan en el PR y se aplican con `prisma migrate deploy`.
  - Los cambios de esquema se coordinan con Alejandra (BD).
- **RLS activado:** la API REST de Supabase no puede leer las tablas. Todo acceso pasa por Prisma en el servidor.
- **Modelos principales:** `Usuario` (rol, `contrasena_hash`, `correo_confirmado`), `Rol`, `Categoria`, `Servicio`, `HorarioServicio`, `CierreServicio`, `Festivo`, `Reserva` (estado y `bloqueo_expira_en`), `Pago` (pasarela, referencia única y estado), `QR`, `RegistroAcceso`, `Empleado`, `Membresia`, `TerminosAceptados` y `CodigoOtp`.
- **Migraciones aplicadas:** 5, la última `20261008120000_otp_verificacion`.
- **Para Supabase Storage** (auditoría §2.5–2.6) habrá que decidir:
  - si se agrega una tabla nueva (por ejemplo `Medio` o `Banner`) o se reutiliza `Servicio.imagenUrl`;
  - si los buckets son públicos o privados;
  - y crear la clave `SUPABASE_SERVICE_ROLE_KEY`, solo en el servidor. Ya existe un cliente admin sin uso en `src/shared/lib/supabase/admin.ts`.

---

## 5. Reglas de negocio vigentes (no romperlas)

- **Turnos:** 1 hora, de 08:00 a 17:00. Los lunes y los festivos (tabla `Festivo`) el complejo no abre.
- **Ventana de reserva:** de hoy a 15 días. El cupo queda bloqueado **10 minutos** para pagar. La disponibilidad cuenta las reservas pagadas y los bloqueos vigentes. Un cron (`/api/cron/expire-reservations`, con `CRON_SECRET`) marca las vencidas.
- **Días de operación:** no se puede quitar un día que tenga reservas activas.
- **Concurrencia:** las reservas usan un `pg_advisory_xact_lock` para no vender dos veces el último cupo.
- **QR:** uno por persona (individual) o uno por reserva (grupal).
- **Pagos:** Wompi en sandbox basta para la entrega. El pago demo debe seguir disponible como respaldo. El webhook es idempotente y solo actualiza un `Pago` en estado `pendiente`.
- **Empleados:** el admin puede cambiar su contraseña, no su correo. Desactivar a un empleado le corta el acceso de inmediato.
- **Fechas:** se calculan en `America/Bogota` (`src/shared/lib/bogota-time.ts`).

---

## 6. Mapa de la auditoría sobre el código

| # | Mejora | Estado actual en el código | Archivos principales | Riesgo o dependencia |
|---|---|---|---|---|
| A | **Ver u ocultar la contraseña** | No existe. Los campos `type="password"` están en el login, el registro (contraseña y confirmación), el restablecimiento y el alta de empleados. | `auth-forms.tsx`, `password-reset-form.tsx`, `admin/employees/page.tsx` | Bajo. Conviene un componente reutilizable (`PasswordInput`) con botón accesible (`aria-label`, `aria-pressed`) y textos traducidos. |
| B | **Botones de pago con Wompi** | El checkout apila: aviso de sandbox → botón "Pagar en línea con Wompi" (crea o reutiliza un `Pago` pendiente) → **un segundo botón** "Continuar al checkout seguro" → aviso de respaldo → botón de pago demo. Son dos pasos para Wompi, textos sin traducir y jerarquía confusa. | `checkout/[reservationId]/page.tsx`, `features/payments/components/wompi-payment-button.tsx`, `features/payments/api/payment.actions.ts`, clases `payment-action`, `payment-button` y `notice-demo` | Medio. No tocar la firma de integridad ni la referencia. Mantener el pago demo. Probar con claves sandbox y sin ellas (sin claves, el botón muestra un aviso). |
| C | **Navegación por rol** (auditoría §2.1) | Un solo header y una sola barra móvil para todos los roles; el botón "Cuenta" duplica un destino; las pestañas de admin están copiadas en 7 páginas. | `site-header.tsx`, `mobile-bottom-nav.tsx`, `user-menu-dropdown.tsx`, las páginas `admin/*` | Alto: lo comparten todas las pantallas. Una sola persona o agente a la vez. |
| D | **Perfil básico** (§2.2) | No existe la ruta. El menú de cuenta solo enlaza a `accountPath` y cierra sesión. | Nueva ruta (por ejemplo `/profile` en un grupo con sesión) y `user-menu-dropdown.tsx` | Depende de C: el botón "Cuenta" debería ir al perfil. Definir si el perfil permite editar algo o solo consultar. |
| E | **Responsive** (§2.3) | 8 `@media`. Paneles y tablas de admin, gráficas de métricas (SVG), formularios y escáner sin revisar. | `globals.css` y todas las páginas | Alto: toca `globals.css`, que es compartido. Trabajar por pantalla. |
| F | **Paleta y legibilidad** (§2.4) | Todo oscuro con azul; sin tokens de estado; tokens `sport-*` viejos. | `globals.css` (`:root`) y los archivos que usan `sport-*` | Alto: afecta a todas las pantallas. Se cruza con PEDG-41 (Jonathan). Definir los tokens primero y aplicarlos después. |
| G | **Supabase Storage** (§2.5) | No se usa. Las imágenes son una URL pegada a mano. | `ServiceForm.tsx`, `service.actions.ts`, `src/shared/lib/supabase/*`, `next.config.ts` | Requiere decisiones (buckets, tamaños, permisos), una clave nueva y quizá una migración. |
| H | **Carrusel** (§2.6) | No existe; la portada es un hero estático. | `src/app/page.tsx` y un componente nuevo | Depende de G. Debe tener pausa, navegación manual y respeto por `prefers-reduced-motion`. |

**Deuda que conviene atender en el mismo esfuerzo:**
- traducir y rediseñar `/verify-email` y el botón de Wompi;
- proteger `/camera-test`;
- las 2 advertencias de lint (`cyan` sin uso en `metrics-export-buttons.tsx` y la dependencia de hook en el escáner: cuidado, cambiarla puede afectar la cámara);
- Next 16.4.0 corrige vulnerabilidades altas, una de caché en modo self-hosted.

---

## 7. Orden y paralelización sugeridos

Los archivos compartidos mandan el orden: `globals.css`, `site-header.tsx` y `mobile-bottom-nav.tsx`. Dos agentes no deben editarlos a la vez.

| Ola | Tareas | ¿En paralelo? |
|---|---|---|
| 0 | Fusionar el **PR #15** (Turnstile) y actualizar **Next a 16.3.8** (§12) | En serie, primero el PR. Son cambios pequeños y la base de todo lo demás. |
| 1 | **A** (ver contraseña), **B** (un solo botón de Wompi) y el **arreglo de PEDG-23** (recuperación de contraseña, coordinado con Alfredo) | Sí, entre sí. Solo comparten `messages.ts`: que cada uno haga un commit pequeño ahí. |
| 2 | **F** (aclarar superficies y agregar tokens de estado en `:root`) | Sola. Es la base de C, D y E. |
| 3 | **C** (navegación por rol) y después **D** (perfil; con cambio de contraseña si PEDG-23 quedó resuelto) | En serie: D depende de C. |
| 4 | **E** (responsive por pantalla) | Se puede repartir por pantalla, pero los cambios en `globals.css` van en serie. |
| 5 | **G** (Storage) y después **H** (carrusel) | En serie. G arranca cuando se confirme la propuesta de §11 y estén creados los buckets y la clave. |

---

## 8. Reglas para los agentes

**Git**
- Ramas desde `develop` actualizada, con el nombre `<Nombre>-feature/<CLAVE-JIRA>/<Descripcion-corta>`.
- Commits convencionales en inglés, en presente y pequeños: `feat(scope): …`, `fix(scope): …`, `docs(scope): …`. El scope es la clave de Jira o la feature.
- **Sin rastro de IA:** ni `Co-Authored-By`, ni "Generated with", ni menciones a Claude o a IA en commits, PR, comentarios ni documentación.
- `git add` por nombre (nunca `-A` ni `.`). Prohibido `push --force` a ramas compartidas, `reset --hard` sobre trabajo ajeno, y hacer push directo a `develop` o `main`.
- **Integración:** primero una rama de prueba `Nicolas-test/...`, después un PR hacia `develop`.

**Seguridad y entorno**
- No editar `.env*`, salvo `.env.example` con valores de ejemplo. Nunca mostrar ni subir secretos.
- No instalar dependencias sin aprobación. Si una tarea lo pide, el agente se detiene y propone opciones.
- **Base de datos:** solo lecturas. Cualquier escritura o migración se consulta antes.

**Validación antes de entregar**
1. `npm run lint`, `npm run typecheck` y `npm run build` sin errores nuevos.
2. Prueba manual de cada criterio de aceptación **en escritorio y en móvil** (ancho de 375 px como mínimo).
3. Regresión:
   - login por rol;
   - catálogo → reserva → pago demo → QR → escaneo;
   - panel de admin;
   - idioma inglés.
4. Un subagente verificador independiente compara el resultado con los criterios.

**Cuentas demo** (ficticias, están en el README): `admin@eliteclub.demo` / `Admin123!`, `cliente@eliteclub.demo` / `Cliente123!`, `empleado@eliteclub.demo` / `Empleado123!`.

**Documentación:** un archivo corto por tarea en `docs/sprint-X/<CLAVE>.md` con estas secciones: qué se hizo, archivos tocados, cómo probarlo, decisiones y pendientes, y el texto del PR. Ver los de `docs/sprint-2/` como ejemplo.

**Jira:** las HU nuevas llevan puntos Fibonacci, prioridad nativa, la label MoSCoW y `Prioridad-X` / `Sprint-N`, sin prefijo `HU-NN`. Al validar una HU se pasa a "En revisión" con un comentario que diga la rama y cómo probarla. No se reescriben los criterios del cliente: el estado se anota debajo de ellos.

---

## 9. Plantilla sugerida para cada prompt de agente

```markdown
## Rol
Eres <rol> en Élite Club (Next.js 16, Prisma 7, Supabase). Lee AGENTS.md y la guía de Next en node_modules/next/dist/docs antes de escribir código.

## Objetivo
<una frase con el resultado visible para el usuario>

## Contexto mínimo
- Archivos de partida: <lista>
- Patrones a seguir: <por ejemplo, requireRole en las acciones, t()/translate para los textos, clases club-* de globals.css>
- No tocar: <archivos de otras olas, firma de Wompi, reglas de reservas>

## Criterios de aceptación
- [ ] <verificable 1>
- [ ] <verificable 2>
- [ ] Funciona en 375 px y en escritorio, en español e inglés

## Restricciones
Sin dependencias nuevas; sin escribir en la base; sin rastro de IA; commits convencionales.

## Entrega
Rama <nombre>, lint, typecheck y build en verde, docs/<...>.md, y un resumen con una tabla: criterio | cómo se verificó.

## Detente y pregunta si
<la decisión abierta que aplique de §10>
```

---

## 10. Decisiones tomadas (Nicolás, 10/10/2026)

| # | Tema | Decisión | Qué implica para los agentes |
|---|---|---|---|
| 1 | Paleta | **Se mantiene el tema oscuro**, pero se **aclaran las superficies** para que no se vea tan oscuro. | Solo se tocan los tokens de `:root`: subir la luminosidad de `--bg-surface`, de `--glass-bg` y de los bordes; agregar tokens de estado (éxito, alerta, error) y un acento secundario. **El fondo base y la identidad azul se conservan.** Revisar el contraste con WCAG AA (4.5:1 para texto). |
| 2 | Navegación móvil | Queda a criterio del agente, con una condición: **que sea amigable y no apriete ni fuerce nada**. | Máximo 4 o 5 ítems en la barra inferior por rol, áreas táctiles de 44 px o más, sin destinos duplicados y con un solo ítem activo a la vez. El resto va al menú de cuenta. Probar desde 360 px de ancho. |
| 3 | Perfil | **Si se arregla el bug de PEDG-23**, el perfil incluye nombre, correo, rol, cerrar sesión **y cambiar contraseña**. Si no se arregla, el perfil es solo de consulta. | El arreglo de PEDG-23 va primero (ver nota abajo). El perfil depende de él. |
| 4 | Imágenes | **Sugerencia del orquestador, pendiente de confirmar:** usar Supabase Storage desde ya, sin esperar al VPS (ver §11). | Hay que guardar la **ruta del archivo**, no la URL completa, para poder cambiar de proveedor después sin migrar datos. |
| 5 | Wompi | **Un solo botón** de Wompi, para que el checkout quede más limpio. | Al pulsarlo, se crea o reutiliza el `Pago` pendiente y se abre el checkout de Wompi directamente, sin el segundo botón "Continuar al checkout seguro". El pago demo queda como opción secundaria y discreta. |
| 6 | Next.js | **Recomendación probada:** actualizar a **16.3.8** (parche); 16.4.0 queda como opción (ver §12). | Una sola tarea pequeña: `next` y `eslint-config-next` a la misma versión, y validar. |

**Nota sobre PEDG-23 (recuperación de contraseña):** hoy el formulario de "olvidé mi contraseña" cambia la clave en Supabase Auth, pero el login valida el hash propio (`Usuario.contrasena_hash`), así que la recuperación no sirve. El arreglo coherente con el resto de la app es:
1. Generar un token temporal (o reutilizar el patrón OTP de `CodigoOtp` / `otp.service.ts`).
2. Enviarlo por correo con Resend.
3. Al confirmar, actualizar `contrasena_hash` con `hashPassword()`.

El mismo servicio puede usarlo el perfil para "cambiar contraseña" (con la contraseña actual como verificación). PEDG-23 es de Alfredo; coordinar con él antes de asignarlo a un agente.

## 11. Propuesta para imágenes y videos (decisión 4)

**Recomendación: usar Supabase Storage ahora, sin esperar al VPS.**

- **El VPS no cambia dónde viven los archivos.** Supabase Storage es un servicio externo: la app en Vercel y la app en el VPS lo usan igual, así que al mudarse al VPS no hay nada que mover.
- **Guardar los archivos en el disco del VPS sería peor:** hay que hacer copias de seguridad a mano, no hay CDN, se pierden si se reinstala el servidor y complica tener más de una instancia.
- **Cambiar de proveedor después es barato** si se guarda la **ruta** del archivo (por ejemplo `servicios/<id>/<uuid>.webp`) y la URL pública se arma con una función (`getMediaUrl(path)`) a partir de una variable de entorno. Si algún día se cambia de proveedor, se cambia la función y se copian los archivos, sin tocar la base.

**Diseño propuesto:**

| Aspecto | Propuesta |
|---|---|
| Buckets | `catalogo` (imágenes de servicios) y `carrusel` (imágenes y videos de la portada). **Públicos para lectura**: es contenido de marketing. |
| Escritura | Solo desde el servidor, en una Server Action con `requireRole("admin")`, usando `SUPABASE_SERVICE_ROLE_KEY` (nunca en el cliente). El cliente admin ya existe en `src/shared/lib/supabase/admin.ts`. |
| Validación | Imágenes JPG, PNG o WebP de hasta 5 MB; video MP4 o WebM de hasta 50 MB (es el límite por archivo del plan gratuito de Supabase). Validar el tipo real del archivo, no solo la extensión. |
| Datos | `Servicio.imagenUrl` pasa a guardar la ruta; las URL externas viejas siguen funcionando. Para el carrusel, una tabla nueva (`Banner`: ruta, tipo, texto alternativo, orden, activo, enlace opcional). **Requiere migración: coordinar con Alejandra.** |
| Next | Agregar el dominio de Supabase Storage a `images.remotePatterns` en `next.config.ts`. |
| Videos | Advertencia: el plan gratuito tiene 1 GB de almacenamiento y un ancho de banda limitado. Para pocos videos cortos alcanza; si crecen, conviene alojarlos en YouTube o Vimeo y guardar el enlace. |

**Qué falta para empezar:** confirmar esta propuesta, crear los buckets y la clave de servicio en el panel de Supabase (lo hace quien administre el proyecto) y agregar la clave a `.env` y a Vercel.

## 12. Actualizar Next.js (decisión 6)

Probado el 10/10 en una copia aislada del repo (worktree), sin tocar `develop`, con la regresión completa: login por rol, las 7 pantallas públicas, las 5 de admin y la exportación, cliente, empleado, permisos, QR, picos de ventas, botones de exportar y Turnstile.

| Versión | Tipo de cambio | lint / typecheck / build | Regresión | Vulnerabilidades altas | Errores en el servidor |
|---|---|---|---|---|---|
| 16.3.6 (actual) | — | ✅ | ✅ | 6 (Next incluida) | 0 |
| **16.3.8** | Parche | ✅ | ✅ todo igual | 5 (**Next corregida**) | 0 |
| 16.4.0 | Menor | ✅ | ✅ todo igual | 5 (Next corregida) | 0 |

**Recomendación: 16.3.8.** Corrige las mismas vulnerabilidades de Next con el cambio más pequeño posible (solo parches). 16.4.0 también pasó todo, pero trae cambios de funcionalidad que no necesitamos ahora.

Las 5 vulnerabilidades que quedan vienen de Prisma y de sus dependencias (`mysql2`, que ni se usa). Su arreglo exige bajar a Prisma 6: **no hacerlo.**

**Riesgo estimado:** bajo. El parche pasó la misma batería de pruebas que la versión actual, sin diferencias. Lo único que no cubre la prueba es la interacción real en el navegador (cámara del escáner, descarga de PDF y checkout de Wompi): revisarla a mano una vez después de actualizar.

## 13. Hallazgo del 10/10: login caído con Turnstile configurado

Con las claves de Turnstile en el `.env`, **`/login` y `/register` daban error 500** (`window is not defined`). El widget leía `window` durante el render en el servidor.

- **Arreglo:** PR #15 (`fix(PEDG-21): avoid reading window during Turnstile server render`), un cambio de una línea, probado.
- **Si Vercel ya tiene las claves de Turnstile, el login del despliegue está caído hasta fusionar ese PR.**
- **Lección para los agentes:** probar siempre con las claves configuradas y también sin ellas. Los componentes `'use client'` igual se renderizan en el servidor: nunca leer `window` o `document` fuera de `useEffect` sin comprobar antes que existen.
