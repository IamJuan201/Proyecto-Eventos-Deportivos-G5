# Retiro del JSON: migración completa a Prisma

> **Para quién:** el equipo, al retomar el trabajo sobre la base de datos.
> **Estado al 2026-10-06:** completado en la rama `Nicolas-feature/BD/Migracion-completa-Prisma`. Toda la app lee y escribe en PostgreSQL (Supabase); `data/elite-club-demo.json`, `src/shared/lib/demo-store.ts`, `json-auth.ts` y los repositorios `mock-*` fueron eliminados.
> Contexto general y convenciones: [MIGRACION-DATOS.md](MIGRACION-DATOS.md).

---

## 1. Qué quedó en cada feature

| Feature | Archivo | Tablas |
|---|---|---|
| Catálogo | `src/features/categories/services/prisma-category.repository.ts`, `src/features/services/services/prisma-service.repository.ts` | `Categoria`, `Servicio`, `HorarioServicio` |
| Usuarios y sesión | `src/features/auth/services/user.service.ts`, `src/features/auth/lib/session.ts`, `src/features/auth/lib/password.ts` | `Usuario`, `Rol` |
| Empleados | `src/features/employees/services/staff.service.ts` | `Empleado`, `Usuario` |
| Cierres | `src/features/schedules/services/closure.service.ts` | `CierreServicio` |
| Reservas, pago demo y QR | `src/features/reservations/services/reservation.service.ts` | `Reserva`, `TerminosAceptados`, `Pago`, `QR` |
| Escáner | `src/features/access-control/services/access.service.ts` | `RegistroAcceso`, `QR`, `Empleado` |
| Métricas | `src/features/metrics/services/metrics.service.ts` (ya existía) | varias |

Utilidades compartidas: `src/shared/lib/bogota-time.ts` (fechas en `America/Bogota`, conversión `@db.Date`/`@db.Time`) e `isPrismaError` / `isUuid` en `src/shared/lib/prisma.ts`.

---

## 2. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| D1 | Ilustración y etiqueta de las tarjetas | Migración `20261006120000_servicio_icono_etiqueta`: `Servicio.icono` y `Servicio.etiqueta` (opcionales). El formulario de servicios las edita; el seed las trae del JSON anterior. |
| D2 | `durationMinutes` | Eliminado: la app solo usa turnos de 1 hora. |
| D3 | Sesiones | Cookie firmada con HMAC (`SESSION_SECRET`), sin tabla. El usuario se relee de la base en cada request. Se reemplaza al integrar Supabase Auth. |
| D4 | Un empleado activo por servicio | Se respeta el índice parcial `Empleado_servicio_id_activo_key`. Crear, reasignar o reactivar un empleado sobre un servicio ocupado muestra "Ese espacio ya tiene un empleado activo…". **Confirmar con el equipo si la regla se mantiene.** |
| D5 | Tipo de cierre | El formulario de cierres pide el tipo. "Eliminar cierre" lo desactiva (`activo = false`) en lugar de borrarlo. |
| D6 | Festivos | Fuera de alcance: la disponibilidad todavía no consulta la tabla `Festivo`. |

Otras reglas implementadas:

- **Sobreventa:** la reserva se crea en una transacción con `pg_advisory_xact_lock` por servicio y fecha. Funciona con el pooler de transacción de Supabase.
- **Bloqueo de 10 minutos:** la disponibilidad cuenta reservas `pagada` y `pendiente_pago` con `bloqueo_expira_en > now()`. Las vencidas se marcan `expirada` al consultar las reservas del cliente.
- **Cédula:** el documento del formulario de reserva se guarda en `Usuario.cedula` la primera vez. Después debe coincidir; si ya está en otra cuenta, se rechaza.
- **Pago demo:** `Pago` con `pasarela = "demo"` y referencia `DEMO-…`. Es idempotente: pagar dos veces no duplica pagos ni QR.
- **QR:** se consume con una actualización condicionada a `usado = false`, así dos lecturas simultáneas no lo consumen dos veces.
- **Regla de menores:** aplica cuando el servicio o su categoría contienen "piscina" en el nombre.

---

## 3. Verificación realizada

- `npm run typecheck`, `npm run lint` y `npm run build` sin errores.
- Con `next dev`: páginas públicas, login de los tres roles, registro y correo repetido, redirecciones por rol, paneles admin y empleado, logout, checkout ajeno (404).
- Script de servicios contra Supabase (27 comprobaciones, todas correctas): disponibilidad, lunes cerrado, **dos clientes compitiendo por el último cupo (gana uno)**, reserva duplicada, reserva ajena oculta, pago idempotente, cierres (rechazo sobre reserva pagada, bloqueo y desactivación), escáner (otro servicio, código inválido, **dos lecturas simultáneas consumen una vez**), estadísticas, bloqueo vencido, cédula distinta, reglas de empleados, horarios de servicio y borrado de categoría con servicios.
- Los datos de prueba se borraron: la base quedó con los mismos conteos que el seed.

---

## 4. Pendiente

| Tema | Responsable / estado |
|---|---|
| `SESSION_SECRET` y `DATABASE_URL` en Vercel (Preview y Production) | Antes de desplegar la rama |
| Confirmar D4 (un empleado activo por servicio) | Equipo |
| `employee.service.ts` / `supabase-employee.repository.ts` (HU-32): usan la API de Supabase, cerrada por RLS | Decidir con Isai si se reemplazan por `staff.service.ts` |
| Supabase Auth en lugar de la cookie firmada | Responsable de OAuth |
| Wompi (checkout + webhook) | Pendiente; modelo listo |
| Job de expiración de bloqueos y festivos en la disponibilidad | Pendiente |
| Descuento de membresía | Pregunta abierta al cliente |
