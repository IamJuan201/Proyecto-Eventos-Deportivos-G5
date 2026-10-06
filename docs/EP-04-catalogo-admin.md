# EP-04 Catálogo del Administrador — Refinamiento de backlog

Épica: **PEDG-5** · Responsable: Nicolás · Corte: `develop` @ `f190fd2` (2026-10-05)

Este documento parte de lo que ya existe en `develop` después de la integración de la demo Élite Club (ver `README.md`). Propone las tareas para refinar en el backlog.

---

## 1. Estado actual

| HU | Jira | Estado en `develop` | Observación |
|---|---|---|---|
| HU-17 Categorías | PEDG-24 | ✅ Integrada (PR #1) | CRUD sobre el JSON de demo y protegida por rol admin. |
| HU-18 Servicios | PEDG-25 | ✅ Integrada (merge directo) | El PR #2 sigue abierto aunque el código ya está en `develop`. |
| HU-19 Franjas horarias | PEDG-26 | 🟡 Parcial | `/admin/schedules` muestra un horario fijo de 08:00 a 17:00 y gestiona cierres; las franjas aún no son configurables. |

**Cómo quedó integrado:**
- Las pantallas y servicios de HU-17/18 se mantienen. **Actualización 2026-10-06:** los repositorios `mock-*` y el JSON fueron reemplazados por `prisma-*.repository.ts` sobre PostgreSQL (ver [PLAN-MIGRACION-PRISMA.md](PLAN-MIGRACION-PRISMA.md)).
- Las acciones verifican `requireRole("admin")` y el layout `(admin)` redirige si el usuario no es admin.
- `demo-store` ya impide eliminar una categoría con servicios, y un servicio con reservas o empleados asignados.
- `npm run lint` y `npm run typecheck` pasan en `develop`.

---

## 2. Hallazgos

| # | Hallazgo | Dónde | Impacto |
|---|---|---|---|
| H1 | Al eliminar una categoría con servicios (o un servicio con reservas), el error de `demo-store` no se captura y se muestra la pantalla de error de Next. | `category.actions.ts`, `service.actions.ts` → `delete*` | **Alto**: el admin no entiende qué pasó. |
| H2 | El formulario de servicios no expone `tipoCobro`, `tipoQr` ni `capacidadPersonas`; los servicios nuevos quedan siempre como `por_hora`, `grupal` y 20 personas. | `ServiceForm.tsx`, `createDemoService` | **Alto**: precio y QR incorrectos en reservas. |
| H3 | El modelo de la UI y el de Prisma no coinciden: `Categoria` no tiene `descripcion`; `Servicio` no tiene `duracion` ni `diasOperacion` (los días viven en `HorarioServicio`). | `types/*.ts` vs `prisma/schema.prisma` | **Alto** para migrar a Prisma. |
| H4 | La portada (`/`) y el detalle (`/services/[id]`) muestran servicios de categorías **inactivas**; solo `/services` las oculta. Incumple un criterio de HU-17. | `src/app/page.tsx`, `(public)/services/[serviceId]/page.tsx` | **Medio**. |
| H5 | Las validaciones están duplicadas y no coinciden: nombre de categoría 3–50 (servicio de la feature), 2–80 (demo-store) y 80 (Prisma); nombre de servicio 80 vs 100. | `*.service.ts`, `demo-store.ts`, `schema.prisma` | **Medio**. |
| H6 | El selector de categoría muestra las inactivas, pero `demo-store` exige una categoría activa al crear. | `ServiceForm.tsx` | **Bajo**: genera un error evitable. |
| H7 | `/admin/categories` y `/admin/services` no usan el sistema visual Élite Club (`club-*`, `glass-panel`, `admin-tabs`) que sí usan schedules, employees y metrics; tampoco tienen la navegación por pestañas. | Componentes de `categories` y `services` | **Medio**: inconsistencia visual y poco contraste en el tema oscuro. |
| H8 | HU-19: el horario es fijo (08:00–17:00, lunes cerrado) y está escrito en el código. No hay franjas por día ni por servicio, aunque Prisma ya tiene `HorarioServicio`. | `(admin)/admin/schedules/page.tsx`, reglas de reserva | **Alto** si HU-19 se mantiene con su alcance original. |
| H9 | Los repositorios se llaman `mock-*`, pero ya persisten en JSON; el TODO de `category.service.ts` ya quedó resuelto por `demo-store`. | `services/` de cada feature | **Bajo**. |

---

## 3. Tareas propuestas

Tamaño estimado: **S** ≤ medio día · **M** ≈ 1 día · **L** ≥ 2 días.

### Prioridad alta

**T1 · Mostrar errores al eliminar o activar/desactivar** — S · HU-17/18 · H1
- [ ] Las acciones `delete*` y `toggle*` devuelven el mensaje de error y no rompen la página.
- [ ] El admin ve, por ejemplo, "Esta categoría tiene espacios asociados. Desactívala para conservar el historial."

**T2 · Completar la configuración del servicio** — M · HU-18 · H2
- [ ] Agregar al formulario y al tipo `Service`: tipo de cobro (`por_hora` / `por_persona`), tipo de QR (`individual` / `grupal`) y capacidad de personas.
- [ ] El precio y el QR de la reserva usan estos valores.

**T3 · Alinear el contrato de datos con Prisma** — M · HU-17/18/19 · H3 · *requiere decisión*
- [ ] Decidir si `descripcion` se agrega a `Categoria` (nueva migración) o se quita de la UI.
- [ ] Decidir si la duración es fija (turnos de 1 hora) o configurable por servicio.
- [ ] Mover los días de operación a `HorarioServicio` (ver T6).
- [ ] Actualizar `types/` para que coincidan con el modelo acordado.

**T4 · Ocultar servicios de categorías inactivas en toda la vista pública** — S · HU-17 · H4 · *coordinar con HU-20*
- [ ] La portada y el detalle filtran por categoría activa, igual que `/services`.
- [ ] El detalle de un servicio de una categoría inactiva responde 404.

### Prioridad media

**T5 · Aplicar el diseño Élite Club al catálogo admin** — M · HU-17/18 · H7
- [ ] `/admin/categories` y `/admin/services` usan `admin-wrap`, `admin-tabs`, `glass-panel`, `admin-form`, `club-input` y `club-button`, como `/admin/schedules`.
- [ ] Se mantiene la separación entre la UI y los servicios (sin cambios de lógica).

**T6 · HU-19: franjas horarias configurables** — L · HU-19 · H8 · *requiere decisión*
- [ ] Definir el alcance: ¿horario configurable por servicio y día (`HorarioServicio`) o se acepta el horario fijo más cierres?
- [ ] Si es configurable: CRUD de franjas por día de la semana y servicio; la disponibilidad de reservas las usa en lugar del 08:00–17:00 fijo.
- [ ] No se puede editar ni eliminar una franja con reservas `pagada` futuras (la regla ya existe para cierres).

**T7 · Una sola fuente de validación** — S · H5, H6
- [ ] Las reglas viven en el servicio de cada feature; `demo-store` solo persiste.
- [ ] Longitudes alineadas con Prisma (`Categoria.nombre` 80, `Servicio.nombre` 100).
- [ ] El selector de categoría muestra solo las activas (y la actual al editar).

### Cuando exista PostgreSQL

**T8 · Repositorios Prisma para el catálogo** — M · HU-17/18/19
- [ ] `prisma-category.repository.ts`, `prisma-service.repository.ts` y repositorio de horarios, con el mismo contrato de interfaz.
- [ ] Cambiar la instancia en `*.service.ts` (una línea por feature).
- [ ] Mapear errores de restricciones (`@unique`, `onDelete: Restrict`) a mensajes de usuario.
- [ ] Renombrar `mock-*` a `json-*` mientras convivan ambos adaptadores (H9).

### Calidad

**T9 · Pruebas de reglas del catálogo** — M
- [ ] Pruebas unitarias de validaciones de categoría y servicio, y de la regla de franjas con reservas confirmadas.
- [ ] Requiere acordar el framework de pruebas del proyecto (no hay uno configurado).

### Proceso

- [ ] Cerrar el PR #2 (su código ya está en `develop`) y borrar las ramas `Nicolas-feature/HU-17/*` y `HU-18/*`.
- [ ] Mover PEDG-24 y PEDG-25 en Jira según lo que se decida para T1–T4.

---

## 4. Decisiones para el refinamiento

1. **Descripción de categoría:** ¿se agrega a Prisma o se elimina de la UI? (T3)
2. **Duración del turno:** ¿fija de 1 hora o configurable por servicio? (T3)
3. **Alcance de HU-19:** ¿franjas configurables por servicio y día, o horario fijo con cierres? (T6)
4. **Framework de pruebas** del proyecto. (T9)
5. **Orden sugerido:** T1 → T2 → T4 → T5 → T3/T6 (después de las decisiones) → T7 → T8.
