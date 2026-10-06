# Migración a PostgreSQL (Supabase + Prisma) — Traspaso de contexto

> **Para quién:** el equipo y sus asistentes de IA. Contexto, decisiones y convenciones de la base de datos para trabajar sin repetir decisiones ni romper la app.
>
> **Estado al 2026-10-06** · Toda la app usa PostgreSQL ([PLAN-MIGRACION-PRISMA.md](PLAN-MIGRACION-PRISMA.md)) · Responsable: Nicolás

---

## 1. Resumen en 30 segundos

- La base PostgreSQL de Supabase **ya existe y está poblada**: 3 migraciones aplicadas y seed cargado (14 tablas).
- El modelo sigue el **DER v2** ([docs/DER.md](DER.md)), que es la fuente de verdad.
- Las tablas están **cerradas a la API pública de Supabase** (RLS sin políticas + permisos revocados). La app accede solo desde el servidor con Prisma.
- **Toda la app lee y escribe en PostgreSQL** con Prisma. El JSON de demo y su adaptador (`demo-store`) fueron eliminados el 2026-10-06.
- Cada feature tiene su servicio Prisma en `src/features/<feature>/services/` (ver sección 6).

---

## 2. Stack y particularidades (léelas antes de escribir código)

| Tema | Detalle |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions). Antes de escribir código, leer la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`). |
| ORM | **Prisma 7.10**, generador `prisma-client`, cliente en `src/generated/prisma` (ignorado por git). `npm run build` ejecuta `prisma generate` antes de `next build`, así Vercel lo genera en cada despliegue; en local también con `npm run db:generate`. |
| Conexión en tiempo de ejecución | Prisma 7 usa un **driver adapter**: `@prisma/adapter-pg` + `pg`. Cliente compartido `getPrisma()` en `src/shared/lib/prisma.ts` (protegido con `server-only`). Se crea en la primera consulta, no al importar, para que `next build` funcione sin `DATABASE_URL`. |
| Configuración de Prisma | `prisma.config.ts` (no `schema.prisma`): ahí está la URL para la CLI (`DIRECT_URL`) y el seed. En Prisma 7 **no existen** `url` ni `directUrl` dentro del `datasource` del schema, ni `prisma.seed` en `package.json`. |
| Base de datos | Supabase PostgreSQL. Next excluye `pg` y Prisma del bundle de servidor por defecto; no hace falta `serverExternalPackages`. |
| Auth | Login propio con `scrypt`; usuarios en `Usuario`; sesión en cookie firmada con HMAC (`SESSION_SECRET`, `src/features/auth/lib/session.ts`). **Google OAuth y Supabase Auth son de otro responsable**; el modelo ya los soporta (ver 4). |
| Pasarela de pago | **Wompi** (Stripe no opera para empresas en Colombia). Aún no integrada; el modelo `Pago` ya está preparado. |

---

## 3. Variables de entorno

| Variable | Archivo | Uso | Formato |
|---|---|---|---|
| `DATABASE_URL` | `.env` y **variables de entorno de Vercel** | App en tiempo de ejecución (`src/shared/lib/prisma.ts`) | Pooler **transaction** (puerto 6543). `?pgbouncer=true` es opcional con `@prisma/adapter-pg` |
| `DIRECT_URL` | `.env` | CLI de Prisma: migraciones y seed | Pooler **session** (puerto 5432) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Supabase Auth/OAuth (cliente) | Públicas, no son secretos |

- `.env*` está en `.gitignore`; `.env.example` es la plantilla versionada **sin secretos**.
- Usar el **session pooler** para `DIRECT_URL`: la conexión directa `db.<ref>.supabase.co` solo funciona por IPv6 y falla en muchas redes Windows.
- `SESSION_SECRET` (`.env` y **Vercel**): firma la cookie de sesión; mínimo 32 caracteres. Sin ella, iniciar sesión falla.
- Next carga `.env.local` con prioridad sobre `.env`: no definir `DATABASE_URL` en ambos.
- **Vercel:** definir `DATABASE_URL` en *Project Settings → Environment Variables* (Preview y Production). Sin ella el build pasa, pero `/admin/metrics` responde error.

---

## 4. Decisiones tomadas

Detalle completo y motivos en [docs/DER.md](DER.md) ("Cambios frente al DER v1").

1. **DER v2 = lógica ya implementada en el proyecto** cuando el DER v1 se contradecía con ella. Por ejemplo: `TipoCierre.evento_privado`, `Categoria.nombre` único, `capacidad_personas` con default 20, `time` sin fracciones, índice parcial con `activo = true`.
2. **Mejoras obligatorias agregadas:** `Reserva.cantidad_personas`, `contiene_menores`, `adulto_responsable`; `Usuario.contrasena_hash` y `cedula` opcionales (OAuth); tabla `Festivo`; pago idempotente.
3. **Pago genérico para Wompi:** `pasarela`, `referencia` (única, la genera el sistema), `transaccion_id` (única, llega por webhook), `medio_pago` opcional y **varios pagos por reserva** (reintentos dentro de los 10 minutos de bloqueo).
4. **Supabase Auth a futuro:** `Usuario.auth_id` (uuid único y opcional) enlaza `auth.users` con `Usuario`; con Google OAuth `contrasena_hash` queda null, `proveedor_auth = 'google'` y `correo_confirmado = true`.
5. **Cierres globales:** `CierreServicio.servicio_id` null = todo el complejo.
6. **PK generadas por PostgreSQL:** `gen_random_uuid()`.
7. **Migraciones:** se respetó la inicial (`20261005120000_initial_booking_platform`) y se agregaron migraciones nuevas encima; nunca se editó una migración ya integrada.

---

## 5. Lo que se hizo (commits de la rama)

| Commit | Qué |
|---|---|
| `feat(db): align Prisma schema with DER v2` | `schema.prisma` + migración `20261005200000_ajuste_der_v2` |
| `feat(db): enable RLS and revoke Supabase API privileges` | Migración `20261005210000_habilitar_rls` + regla en `prisma/migrations/README.md` |
| `docs(db): add DER v2 reference` | `docs/DER.md` |
| `chore(db): keep LF line endings in Prisma migrations` | `.gitattributes` (Prisma guarda checksum de cada migración) |
| `feat(db): add DER-shaped seed data` | `prisma/seed/datos.json` |
| `build(db): add Prisma PostgreSQL adapter and tsx` | Dependencias |
| `feat(db): add idempotent seed for DER data` | `prisma/seed.ts` + `prisma.config.ts` |
| `feat(db): add shared server-only Prisma client` | `src/shared/lib/prisma.ts` |
| `feat(metrics): read dashboard metrics from PostgreSQL` | Piloto: `/admin/metrics` |

### Verificaciones realizadas

- `prisma migrate status`: al día. `prisma migrate diff` entre base y schema: vacío.
- 14 tablas, 6 enums e índice parcial `Empleado_servicio_id_activo_key` presentes.
- RLS activo en todas las tablas de `public` (incluida `_prisma_migrations`); `anon` y `authenticated` sin privilegios. Probado contra la API real de Supabase: lectura e inserción rechazadas (`42501 permission denied`).
- Seed: conteos idénticos al mock y segunda ejecución sin duplicados; fechas, horas y `timestamptz` comprobadas en la base.
- Piloto: `/admin/metrics` responde 200 con los valores esperados del seed ($202.000, 2 reservas pagadas, 17 personas, 1 de 2 accesos, 2 empleados).
- `npm run typecheck` y `npm run lint` sin errores.

---

## 6. Mapa de archivos

| Archivo | Rol |
|---|---|
| `prisma/schema.prisma` | Modelo (DER v2) |
| `prisma/migrations/*` | Migraciones versionadas (**LF obligatorio**, ver `.gitattributes`) |
| `prisma/migrations/README.md` | Reglas de migraciones y seguridad |
| `prisma/seed/datos.json` | Datos demo con columnas del DER y UUID fijos |
| `prisma/seed.ts` | Seed idempotente (`npx prisma db seed`) |
| `prisma.config.ts` | URL de la CLI y comando de seed |
| `src/shared/lib/prisma.ts` | Cliente Prisma único para la app |
| `src/features/metrics/services/metrics.service.ts` | Ejemplo de servicio que consulta con Prisma |
| `src/shared/lib/bogota-time.ts` | Fechas y horas de negocio en `America/Bogota` y conversión `@db.Date` / `@db.Time` |
| `src/features/*/services/*.ts` | Servicios Prisma por feature (lista en [PLAN-MIGRACION-PRISMA.md](PLAN-MIGRACION-PRISMA.md) §1) |
| `docs/DER.md` | DER v2 |

---

## 7. Cómo continuar la migración (instrucciones para el asistente)

### 7.1 Estado

La migración por colecciones terminó: la app ya no usa el JSON. Qué archivo maneja cada tabla, las decisiones tomadas (D1–D6) y la verificación están en [PLAN-MIGRACION-PRISMA.md](PLAN-MIGRACION-PRISMA.md).

### 7.2 Convenciones para escribir código con Prisma

- Obtener el cliente siempre con `getPrisma()` de `@/shared/lib/prisma`, dentro de la función que consulta (nunca `new PrismaClient()` en otra parte ni al nivel del módulo).
- Consultas en `src/features/<feature>/services/*.ts`; las páginas no llaman a Prisma directamente.
- Conversión de tipos: `Decimal` → `Number(...)`; `@db.Date` → `date.toISOString().slice(0, 10)`; `@db.Time` → `time.toISOString().slice(11, 16)` (las horas se guardan sobre `1970-01-01` UTC).
- Calcular "hoy", "+15 días" y franjas horarias en **`America/Bogota`** (el servidor corre en UTC).
- Errores de Prisma a mensajes de usuario: `P2002` = valor único repetido; `P2003` = restricción de clave foránea (por ejemplo, borrar una categoría con servicios).
- Reservas: verificar cupos y crear la reserva **en una sola transacción** con bloqueo (`SELECT … FOR UPDATE` o advisory lock) para evitar sobreventa.

### 7.3 Reglas de migraciones

- Cambiar `schema.prisma` y crear la migración en la **misma rama y PR**: `npx prisma migrate dev --name descripcion-corta`.
- **Nunca editar** una migración ya integrada a `develop`; crear una nueva.
- **Toda tabla nueva** debe incluir `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;` en su migración. No usar `FORCE ROW LEVEL SECURITY` (bloquearía a Prisma).
- En bases compartidas usar `npx prisma migrate deploy`; `migrate reset` solo en una base local propia.

### 7.4 Comandos

```bash
npm run db:generate          # genera el cliente Prisma
npx prisma migrate status    # migraciones pendientes
npm run db:migrate           # prisma migrate deploy
npx prisma db seed           # carga prisma/seed/datos.json (idempotente)
npx prisma studio            # explorar datos
```

---

## 8. Seguridad

**Hecho:**
- RLS sin políticas en todas las tablas de `public`.
- `REVOKE ALL` a `anon` y `authenticated` sobre tablas, secuencias y funciones, también para objetos futuros.
- Cliente Prisma protegido con `server-only` (falla el build si se importa desde un componente cliente).
- Credenciales solo en `.env` (ignorado por git).

**Recomendado (requiere el panel de Supabase o decisión del equipo):**
1. Quitar `public` de los *exposed schemas* de la Data API: el equipo usa Supabase solo para Auth.
2. Crear un rol de base con solo permisos de datos (`SELECT/INSERT/UPDATE/DELETE`) para `DATABASE_URL`, y dejar `postgres` solo para migraciones (`DIRECT_URL`).
3. Revisar el **Security Advisor** de Supabase.
4. Rotar la contraseña de la base si se compartió por chat o capturas.

---

## 9. Pendientes y preguntas abiertas

| Tema | Estado |
|---|---|
| Migrar el resto de colecciones | ✅ Hecho el 2026-10-06 |
| `SESSION_SECRET` y `DATABASE_URL` en Vercel | Pendiente antes de desplegar |
| Un empleado activo por servicio (índice parcial) | Confirmar con el equipo |
| Integración Wompi (widget/checkout + webhook firmado) | Pendiente; modelo listo |
| Supabase Auth / Google OAuth (`Usuario.auth_id`) | Otro responsable |
| Job de expiración de bloqueos (10 min) | La disponibilidad ya ignora bloqueos vencidos; falta el cron que los marque `expirada` |
| Festivos 2027 en adelante | Cargar en `Festivo`; los de oct–dic 2026 están en el seed (verificar contra el calendario oficial) |
| Precio de piscina: ¿por ingreso o por hora? | Pregunta abierta al cliente |
| Membresía 30 %: ¿mes completo de una vez o semana a semana? | Pregunta abierta al cliente |
| Manillas: ¿entrada general o por servicio? | Pregunta abierta al cliente |

### Cuentas demo en la base

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@eliteclub.demo` | `Admin123!` | admin |
| `cliente@eliteclub.demo` | `Cliente123!` | cliente |
| `empleado@eliteclub.demo` | `Empleado123!` | empleado (Piscina olímpica) |
| `mateo.vargas@eliteclub.demo` | `Empleado123!` | empleado (Fútbol 11), agregado en el seed porque el JSON anterior lo tenía como empleado sin usuario |

Credenciales ficticias, solo para entornos de prueba.
