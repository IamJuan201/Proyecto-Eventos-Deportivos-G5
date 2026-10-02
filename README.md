# Eventos Deportivos G5

Aplicación web construida con Next.js, React y TypeScript. Supabase proporciona PostgreSQL y los servicios de Supabase; Prisma gestiona el esquema y las migraciones.

## Requisitos

- Node.js compatible con la versión instalada de Next.js.
- npm.
- Una base de datos PostgreSQL en Supabase.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` como `.env` y completa las dos variables `NEXT_PUBLIC_SUPABASE_*` con la URL del proyecto y su clave publishable. Completa también `DATABASE_URL` y `DIRECT_URL` con las cadenas de conexión de PostgreSQL en Supabase. Next.js y Prisma cargan estas variables desde `.env`; no lo subas al repositorio.
3. Inicia Next.js con `npm run dev` y abre `http://localhost:3000`.

Comprobaciones disponibles:

- `npm run lint`: ejecuta ESLint.
- `npm run typecheck`: comprueba los tipos de TypeScript sin emitir archivos.
- `npm run build`: genera la compilación de producción.

## Estructura

- `src/app/`: rutas y layouts de Next.js.
- `src/features/<dominio>/`: componentes, API, servicios y tipos propios de cada dominio funcional.
- `src/shared/`: componentes, utilidades, tipos y clientes compartidos entre features.
- `prisma/schema.prisma`: modelo de datos de Prisma.
- `prisma/migrations/`: migraciones versionadas de PostgreSQL.
- `src/shared/lib/supabase/`: clientes Supabase reutilizables para navegador y servidor, y lectura centralizada de su configuración pública.

Las features deben mantener su lógica dentro de su propio dominio. El código solo pasa a `src/shared/` cuando realmente se reutiliza entre dominios.

## Base de datos

La decisión del equipo es usar Prisma como ORM code-first para el acceso relacional y las migraciones de PostgreSQL. El SDK oficial de Supabase se usa para Auth y servicios propios de Supabase, con clientes SSR basados en cookies. No se debe duplicar el acceso relacional usando `.from()` del cliente Supabase; las consultas de dominio van por Prisma. Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` son públicas y no deben contener secretos; nunca expongas una service-role key al navegador.

Define primero los modelos en `prisma/schema.prisma`. Para crear y aplicar una migración en desarrollo usa `npx prisma migrate dev --name descripcion-corta`; para aplicar migraciones ya versionadas en un entorno desplegado usa `npx prisma migrate deploy`. La configuración de Prisma toma `DIRECT_URL` para las migraciones y `DATABASE_URL` queda disponible para la conexión de la aplicación.

El flujo de ramas y Pull Requests está documentado en [GIT_WORKFLOW.md](./GIT_WORKFLOW.md).
