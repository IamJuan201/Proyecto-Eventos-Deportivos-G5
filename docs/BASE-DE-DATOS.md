# Base de datos: Supabase + Prisma

> **Para quién:** el equipo y sus asistentes de IA, antes de tocar datos, migraciones o autenticación.
> **Estado al 2026-10-06:** toda la app lee y escribe en PostgreSQL (Supabase) con Prisma. El modelo es el [DER v2](DER.md).

## 1. Resumen

- **4 migraciones aplicadas** y seed cargado en la base compartida (14 tablas).
- **Solo el servidor accede a los datos**, con Prisma. La API pública de Supabase está cerrada (RLS sin políticas y permisos revocados).
- **Supabase se usa para dos cosas:** la base PostgreSQL y el login con Google/GitHub y la recuperación de contraseña (Supabase Auth). Nada más.

## 2. Configuración

| Variable | Dónde | Para qué |
|---|---|---|
| `DATABASE_URL` | `.env` y Vercel | La app. Pooler de **transacción** (puerto 6543). |
| `DIRECT_URL` | `.env` | CLI de Prisma: migraciones y seed. Pooler de **sesión** (puerto 5432). |
| `SESSION_SECRET` | `.env` y Vercel | Firma la cookie de sesión (sección 4). Mínimo 32 caracteres. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | OAuth y recuperación de contraseña. Son públicas. |

- La plantilla es `.env.example`; los `.env*` están ignorados por git. Las credenciales se comparten por un canal privado.
- No usar la conexión directa `db.<ref>.supabase.co`: solo funciona por IPv6 y falla en muchas redes Windows.
- Next carga `.env.local` con prioridad sobre `.env`: no definir la misma variable en ambos.
- En Vercel, sin `DATABASE_URL` el build pasa pero las páginas fallan, y sin `SESSION_SECRET` nadie puede iniciar sesión.

```bash
npm run db:generate          # genera el cliente en src/generated/prisma (ignorado por git)
npx prisma migrate status    # ¿hay migraciones pendientes?
npm run db:migrate           # aplica migraciones (prisma migrate deploy)
npx prisma db seed           # carga prisma/seed/datos.json; idempotente
npx prisma studio            # explorar datos
```

## 3. Código

| Feature | Archivo | Tablas |
|---|---|---|
| Catálogo | `src/features/categories/services/prisma-category.repository.ts`, `src/features/services/services/prisma-service.repository.ts` | `Categoria`, `Servicio`, `HorarioServicio` |
| Usuarios y sesión | `src/features/auth/services/user.service.ts`, `src/features/auth/lib/session.ts`, `password.ts` | `Usuario`, `Rol` |
| Empleados | `src/features/employees/services/staff.service.ts` | `Empleado`, `Usuario` |
| Cierres | `src/features/schedules/services/closure.service.ts` | `CierreServicio` |
| Reservas, pago demo y QR | `src/features/reservations/services/reservation.service.ts` | `Reserva`, `TerminosAceptados`, `Pago`, `QR` |
| Escáner | `src/features/access-control/services/access.service.ts` | `RegistroAcceso`, `QR` |
| Métricas | `src/features/metrics/services/metrics.service.ts` | varias |

Convenciones:

- Cliente: siempre `getPrisma()` de `@/shared/lib/prisma`, dentro de la función que consulta. Nunca `new PrismaClient()` en otro lugar.
- Las consultas van en `src/features/<feature>/services/`. Las páginas llaman a esos servicios, no a Prisma.
- Errores para el usuario con `isPrismaError(error, "P2002")` (valor único repetido) o `"P2003"` (clave foránea en uso). Validar ids de URL o formularios con `isUuid` antes de consultar.
- Fechas y horas de negocio en `America/Bogota` con `src/shared/lib/bogota-time.ts`: "hoy", la ventana de 15 días y la conversión de `@db.Date` y `@db.Time` (las horas se guardan sobre `1970-01-01` UTC).
- `Decimal` se convierte con `Number(...)`.
- Prisma 7: la URL de la CLI y el comando de seed están en `prisma.config.ts`, no en el schema ni en `package.json`. `npm run build` ejecuta `prisma generate`, así Vercel genera el cliente en cada despliegue.

## 4. Sesión y Supabase Auth

**Hoy:** login con correo y contraseña propio (`scrypt`). La sesión es una cookie `HttpOnly` de 14 días con el id del usuario y una firma HMAC hecha con `SESSION_SECRET`. Si alguien modifica la cookie, la firma deja de coincidir y queda sin sesión. En cada request el usuario y su rol se leen de la base, así una cuenta desactivada pierde el acceso de inmediato.

- **Si el secreto se filtra**, cualquiera puede fabricar sesiones de cualquier usuario: rotarlo. Al cambiarlo, todos deben volver a iniciar sesión.
- **Limitación:** no hay tabla de sesiones, así que cerrar sesión borra la cookie pero no invalida el token en el servidor.

**Google/GitHub:** Supabase Auth verifica la identidad; `/api/auth/callback` busca o crea el `Usuario` (sin contraseña, con `auth_id`) y abre la sesión propia.

**Pendiente: pasar todo a Supabase Auth.** No tiene bloqueo técnico; falta asignar responsable. Tareas:

1. Las contraseñas `scrypt` no se pueden importar a Supabase: recrear las cuentas demo o enviar restablecimiento de contraseña.
2. El alta de empleados necesita la API de administración (`SUPABASE_SERVICE_ROLE_KEY`, solo en servidor; cliente en `src/shared/lib/supabase/admin.ts`).
3. Configurar un SMTP propio (el de Supabase es para pruebas) o desactivar la confirmación de correo durante el sprint.
4. Registrar las URLs de redirección de local, Preview y Production.
5. Reemplazar `startSession`, `getCurrentUser` y `clearSession` en `session.ts` por la sesión de Supabase, buscando el `Usuario` por `auth_id`. Después, quitar `SESSION_SECRET`.

## 5. Migraciones

| Migración | Qué hace |
|---|---|
| `20261005120000_initial_booking_platform` | Modelo inicial e índice parcial "un empleado activo por servicio". |
| `20261005200000_ajuste_der_v2` | Ajustes del DER v2. |
| `20261005210000_habilitar_rls` | RLS sin políticas y permisos revocados a `anon` y `authenticated`. |
| `20261006120000_servicio_icono_etiqueta` | `Servicio.icono` y `Servicio.etiqueta` para las tarjetas del catálogo. Su comentario cita `PLAN-MIGRACION-PRISMA.md`, documento que ahora es esta guía. |

Reglas:

- El cambio de `schema.prisma` y su migración van en la **misma rama y PR**: `npx prisma migrate dev --name descripcion-corta` (solo en una base propia).
- En la base compartida usar `npx prisma migrate deploy`. `migrate reset` solo en una base local propia.
- **Nunca editar una migración ya aplicada o integrada**: Prisma guarda su checksum. Crear una nueva.
- Los archivos de migración usan finales de línea **LF** (`.gitattributes`).
- **Toda tabla nueva** incluye `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;`. No usar `FORCE ROW LEVEL SECURITY`: bloquearía a Prisma.
- Los índices parciales no se expresan en el schema de Prisma: van en SQL dentro de la migración.
- El seed (`prisma/seed/datos.json`) usa UUID fijos y es idempotente. Nunca subir datos reales de clientes.

## 6. Reglas de negocio en la base

- **Sobreventa:** la reserva se crea en una transacción con `pg_advisory_xact_lock` por servicio y fecha. Funciona con el pooler de transacción.
- **Bloqueo de 10 minutos:** cuentan como ocupadas las reservas `pagada` y las `pendiente_pago` con `bloqueo_expira_en > now()`. Las vencidas se marcan `expirada` al consultar las reservas del cliente.
- **Pago demo:** `Pago` con `pasarela = "demo"` y referencia `DEMO-…`; es idempotente. Un `Pago` por intento, varios por reserva (preparado para reintentos con Wompi).
- **QR:** se consume con `updateMany` condicionado a `usado = false`, así dos lecturas simultáneas lo usan una sola vez.
- **Cédula:** la de la primera reserva se guarda en `Usuario.cedula`; después debe coincidir.
- **Empleados:** un empleado activo por servicio (índice parcial). Crear, reasignar o reactivar sobre un servicio ocupado muestra un error.
- **Cierres:** `servicio_id` null = todo el complejo. "Eliminar" desactiva (`activo = false`). El tipo es obligatorio.
- **Menores:** la regla del metro aplica si el servicio o su categoría contienen "piscina".
- **Turnos:** siempre de 1 hora, 08:00–17:00; cada día de operación es una fila de `HorarioServicio`.

## 7. Seguridad

Hecho: RLS sin políticas en todas las tablas de `public`, `REVOKE ALL` a `anon` y `authenticated` (también para objetos futuros), cliente Prisma con `server-only` y credenciales solo en `.env`.

Recomendado:

1. Quitar `public` de los *exposed schemas* de la Data API de Supabase.
2. Usar un rol de base solo con permisos de datos para `DATABASE_URL` y dejar `postgres` para migraciones.
3. Revisar el Security Advisor de Supabase.
4. Rotar la contraseña de la base si se compartió por chat o capturas.

## 8. Pendientes y preguntas abiertas

| Tema | Estado |
|---|---|
| `SESSION_SECRET` y `DATABASE_URL` en Vercel | Antes de desplegar |
| Un empleado activo por servicio | Confirmar con el equipo; si cambia, migración que quite el índice |
| `employee.service.ts` y `supabase-employee.repository.ts` (HU-32) | Resuelto en PEDG-31: se retiraron; todo pasa por `staff.service.ts` |
| Supabase Auth | Sección 4 |
| Wompi (checkout + webhook firmado) | Modelo listo |
| Job que marque bloqueos vencidos como `expirada` | La disponibilidad ya los ignora |
| Festivos en la disponibilidad | La tabla `Festivo` existe pero no se consulta; cargar 2027 en adelante |
| Precio de piscina: ¿por ingreso o por hora? | Pregunta al cliente |
| Membresía 30 %: ¿mes completo o semana a semana? | Pregunta al cliente; hoy descuento 0 |
| Manillas: ¿entrada general o por servicio? | Pregunta al cliente |
