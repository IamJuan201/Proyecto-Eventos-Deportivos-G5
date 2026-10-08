# Élite Club — Eventos Deportivos G5

Aplicación web para explorar espacios de un complejo deportivo, reservar turnos, pagar una reserva de prueba, recibir códigos QR y validar el ingreso. Este documento es el traspaso técnico y funcional para que el equipo continúe sus historias de usuario (HU).

## Estado del sprint

La demo incluye lobby y catálogo con identidad visual Élite Club, autenticación email/password, disponibilidad y reserva, checkout/pago simulado, generación de QR, escáner de acceso y herramientas de operación. **Toda la persistencia está en PostgreSQL (Supabase) y se accede con Prisma.**

Los pagos son demostrativos: no se realiza ningún cargo real (la integración con Wompi está pendiente).

| Documento | Contenido |
| --- | --- |
| [docs/BASE-DE-DATOS.md](docs/BASE-DE-DATOS.md) | Configuración, código por feature, sesión y Supabase Auth, migraciones, reglas, seguridad y pendientes. |
| [docs/DER.md](docs/DER.md) | Modelo de datos (fuente de verdad). |
| [GIT_WORKFLOW.md](GIT_WORKFLOW.md) | Ramas y Pull Requests. |

## Inicio rápido

Requisitos: Node.js compatible con la versión de Next.js instalada y npm.

1. Copiar `.env.example` a `.env` y completar `DATABASE_URL`, `DIRECT_URL` y `SESSION_SECRET` (el tech lead comparte las credenciales de Supabase por un canal privado; no se versionan). Las variables `NEXT_PUBLIC_SUPABASE_*` van en `.env.local` y solo son necesarias para OAuth.
2. Instalar y arrancar:

   ```bash
   npm install
   npm run db:generate
   npm run dev
   ```

3. Abrir <http://localhost:3000>.

La base compartida ya tiene las migraciones y el seed aplicados. Si trabajas con una base propia: `npm run db:migrate` y luego `npx prisma db seed`.

| Comando | Resultado |
| --- | --- |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Verificación de tipos TypeScript. |
| `npm run build` | `prisma generate` + compilación de producción. |
| `npm run db:generate` | Genera el cliente Prisma. |
| `npm run db:migrate` / `npx prisma db seed` | Migraciones y datos demo (ver [docs/BASE-DE-DATOS.md](docs/BASE-DE-DATOS.md)). |

## Funcionalidad implementada

### Cliente

1. Inicio → catálogo de espacios → detalle del servicio.
2. Para reservar se exige sesión. La página muestra inicio de sesión/registro y vuelve al servicio elegido después de autenticar.
3. Formulario con fecha, turno, cupos/personas, documento, información de menores y aceptación de términos.
4. Reserva pendiente con bloqueo de 10 minutos → checkout de prueba → confirmación y QR.
5. Consulta de reservas desde “Mis reservas”.

### Operación

- ABM de categorías y servicios (con ilustración y etiqueta de la tarjeta).
- Gestión de empleados asignados a servicios: **un empleado activo por servicio** (índice único de la base).
- Creación y desactivación de cierres por servicio o globales, con tipo (mantenimiento, festivo, evento privado).
- Página de métricas.
- Escáner QR limitado al espacio asignado al empleado; valida pago, horario, uso previo y regla de menor en piscina. Un QR de otro espacio indica cuál es el espacio correcto, se registra como lectura rechazada y no se consume.

### Reglas que valida la app

- Reservas desde hoy hasta 15 días adelante; turnos de 1 hora entre 08:00 y 17:00 (hora de Bogotá).
- Cierre los lunes, días activos del servicio (`HorarioServicio`) y cierres de operación (`CierreServicio`).
- Se revisa aforo/cupo y se impiden reservas activas simultáneas del mismo cliente. La creación usa una transacción con bloqueo por servicio y fecha, así el último cupo no se vende dos veces.
- Reservas pendientes ocupan el turno durante 10 minutos (`bloqueo_expira_en`); después dejan de contar y se marcan como expiradas.
- Precio por persona o por espacio/hora según la configuración del servicio.
- El pago de prueba confirma y genera QR individual o grupal. Un QR solo se consume una vez, aunque se lea dos veces al mismo tiempo.
- La membresía no aplica descuento aún: mantenerlo en 0 hasta acordar regla y escenarios con el cliente.

## Cuentas y roles

- Registro e inicio de sesión con correo y contraseña en `/register` y `/login`; también Google y GitHub cuando están configuradas las variables `NEXT_PUBLIC_SUPABASE_*`. Cómo funciona la sesión: [docs/BASE-DE-DATOS.md §4](docs/BASE-DE-DATOS.md#4-sesión-y-supabase-auth).
- **Admin:** `/admin/metrics`, `/admin/categories`, `/admin/services`, `/admin/schedules`, `/admin/employees`.
- **Empleado:** `/employee` (actividad) y `/scanner` (solo su espacio).
- **Cliente:** `/services`, reserva, checkout y `/my-reservations`.
- El admin crea empleados desde Operación → Empleados; el registro público crea clientes.

Cuentas demo (credenciales ficticias, solo para pruebas):

| Perfil | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@eliteclub.demo` | `Admin123!` |
| Cliente | `cliente@eliteclub.demo` | `Cliente123!` |
| Empleado (Piscina olímpica) | `empleado@eliteclub.demo` | `Empleado123!` |
| Empleado (Fútbol 11) | `mateo.vargas@eliteclub.demo` | `Empleado123!` |

## Mapa del repositorio

| Directorio/archivo | Responsabilidad |
| --- | --- |
| `src/app/` | Rutas, layouts, estilos globales y API route handlers. |
| `src/features/auth/` | Formularios, rutas de login/register, hash, sesión firmada (`lib/session.ts`), usuarios (`services/user.service.ts`), OAuth. |
| `src/features/reservations/` | Disponibilidad, reserva, pago demo y QR (`services/reservation.service.ts`). |
| `src/features/categories/`, `src/features/services/` | Catálogo y administración (`prisma-*.repository.ts`). |
| `src/features/employees/` | Empleados: alta, cambio de contraseña, activación y asignación de servicio (`services/staff.service.ts`). |
| `src/features/schedules/` | Cierres de operación (`services/closure.service.ts`). |
| `src/features/access-control/` | Escáner y registro de acceso (`services/access.service.ts`). |
| `src/features/metrics/` | Métricas del panel admin. |
| `src/shared/lib/prisma.ts`, `bogota-time.ts` | Cliente Prisma y utilidades de fecha/hora. |
| `src/shared/components/` | Header, footer y componentes comunes del catálogo. |
| `src/shared/lib/supabase/` | Cliente Supabase para OAuth/recuperación. |
| `prisma/` | Schema, migraciones, seed (`seed/datos.json`). |

Mantener lógica dentro de su feature; mover a `src/shared/` únicamente lo que sea realmente reutilizable.

## HU recomendadas para continuar

1. **Pagos reales (Wompi):** widget/checkout, webhook firmado e idempotente, reintentos dentro del bloqueo de 10 minutos; el modelo `Pago` ya está listo.
2. **Auth productiva:** migrar la sesión firmada a Supabase Auth (`Usuario.auth_id`) y completar recuperación de contraseña.
3. **Expiración de bloqueos:** job programado que marque como expiradas las reservas vencidas (hoy se marcan al consultarlas; la disponibilidad ya las ignora).
4. **Festivos:** decidir con el cliente si los festivos de la tabla `Festivo` cierran el complejo y aplicarlo a la disponibilidad.
5. **Membresía:** confirmar porcentaje, vigencia, límites y casos del descuento con el cliente.
6. **Pruebas:** unitarias para reglas de disponibilidad/precios/expiración; integración para Auth/reserva/pago/QR; E2E de recorridos críticos.
7. **Cierre con cliente:** validar diseño responsive, accesibilidad, contenido legal/privacidad y reglas de negocio pendientes.

## Flujo Git del equipo

Seguir [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) para ramas y Pull Requests. Integrar HU en `develop` por PR revisable. Antes de entregar una HU, ejecutar lint y typecheck, explicar cambios de datos/API y no incluir `.env*`, contraseñas, tokens ni información real de usuarios.
