# Élite Club — Eventos Deportivos G5

Aplicación web para explorar espacios de un complejo deportivo, reservar turnos, pagar una reserva de prueba, recibir códigos QR y validar el ingreso. Este documento es el traspaso técnico y funcional para que el equipo continúe sus historias de usuario (HU).

## Estado del sprint

La demo incluye lobby y catálogo con identidad visual Élite Club, autenticación email/password, disponibilidad y reserva, checkout/pago simulado, generación de QR, escáner de acceso y herramientas de operación. Mientras el equipo termina de preparar PostgreSQL, **toda la persistencia de demo usa un único JSON compartido**: `data/elite-club-demo.json`.

La base relacional está modelada con Prisma (code-first) y tiene una migración inicial versionada, pero esa migración aún debe aplicarse a la instancia PostgreSQL del equipo. Los pagos son demostrativos, no se realiza ningún cargo real.

## Inicio rápido

Requisitos: Node.js compatible con la versión de Next.js instalada y npm.

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>. El recorrido JSON local no requiere `.env` ni Supabase.

| Comando | Resultado |
| --- | --- |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Verificación de tipos TypeScript. |
| `npm run build` | Compilación de producción. |
| `npm run db:generate` | Genera el cliente Prisma. |
| `npm run db:migrate` | Aplica migraciones Prisma; requiere PostgreSQL configurado. |

## Funcionalidad implementada

### Cliente

1. Inicio → catálogo de espacios → detalle del servicio.
2. Para reservar se exige sesión. La página muestra inicio de sesión/registro y vuelve al servicio elegido después de autenticar.
3. Formulario con fecha, turno, cupos/personas, documento, información de menores y aceptación de términos.
4. Reserva pendiente con bloqueo de 10 minutos → checkout de prueba → confirmación y QR.
5. Consulta de reservas desde “Mis reservas”.

### Operación

- ABM de categorías y servicios.
- Gestión de empleados asignados a servicios.
- Creación y eliminación de cierres por servicio o globales.
- Página de métricas del demo.
- Escáner QR limitado al espacio asignado al empleado; valida pago, horario, uso previo y regla de menor en piscina. Un QR de otro espacio indica cuál es el espacio correcto, se registra como lectura rechazada y no se consume.

### Reglas que valida el demo

- Reservas desde hoy hasta 15 días adelante; turnos de 1 hora entre 08:00 y 17:00.
- Cierre los lunes, días activos del servicio y cierres de operación.
- Se revisa aforo/cupo y se impiden reservas activas simultáneas del mismo cliente.
- Reservas pendientes bloquean el turno por 10 minutos y luego expiran.
- Precio por persona o por espacio/hora según la configuración del servicio.
- El pago de prueba confirma y genera QR individual o grupal.
- La membresía no aplica descuento aún: mantenerlo en 0 hasta acordar regla y escenarios con el cliente.

## Registro, inicio de sesión y OAuth

- `/register` y `/login` llaman a `/api/auth/register`, `/api/auth/login` y `/api/auth/logout`.
- Registro y login de correo funcionan sin Supabase y guardan cuentas en el JSON global. Para registrarse: nombre, correo y contraseña de 8 caracteres o más.
- Las contraseñas se almacenan derivadas con `scrypt` (nunca en texto plano). La sesión se representa con cookie `HttpOnly`, `SameSite=Lax` y vigencia de 14 días; el token y expiración se guardan en `sessions`.
- La reserva realiza una comprobación de sesión en servidor. El encabezado presenta inicio de sesión al visitante y cuenta/cierre de sesión a la persona autenticada.
- Cuentas listas para el demo (credenciales ficticias, no usar fuera del entorno local):

  | Perfil | Correo | Contraseña |
  | --- | --- | --- |
  | Administrador | `admin@eliteclub.demo` | `Admin123!` |
  | Cliente | `cliente@eliteclub.demo` | `Cliente123!` |
  | Empleado | `empleado@eliteclub.demo` | `Empleado123!` |

- Admin (`role: "admin"`): `/admin/metrics`, `/admin/services`, `/admin/categories`, `/admin/schedules`, `/admin/employees`. Tiene panel de métricas, CRUD de catálogo, cierres/mantenimiento y alta/activación/reasignación de empleados. Las rutas y acciones administrativas verifican el rol.
- Empleado (`role: "empleado"`): `/employee` muestra lecturas diarias, autorizados, rechazos e historial reciente; `/scanner` valida QRs únicamente en su espacio activo. La cuenta demo está asignada a Piscina olímpica.
- Cliente (`role: "cliente"`): explora `/services`, reserva y consulta su historial autenticado en `/my-reservations`. Las reservas se filtran con el correo de la sesión.
- El admin crea empleados desde Operación → Empleados; asigna espacio y contraseña inicial. El alta pública crea usuarios cliente. Las tres cuentas demo están guardadas en `users` con hashes de contraseña.
- Alfredo dejó soporte OAuth de Google y GitHub vía Supabase. Los botones se muestran cuando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` están configuradas. Configurar también las URLs de callback en Supabase. El callback crea/recupera cuenta local y sesión JSON para usarla en la demo.
- Recuperación/restablecimiento de contraseña sigue dependiendo de Supabase configurado; el flujo local de email/password está disponible aparte.

## Persistencia temporal: JSON global

El acceso al archivo se centraliza en `src/shared/lib/demo-store.ts`, con una cola para serializar lecturas y escrituras dentro del proceso. Las modificaciones se guardan con archivo temporal y reemplazo. Si el archivo no existe, se crea con base vacía; el repositorio incluye un catálogo inicial en `data/elite-club-demo.json`.

| Clave JSON | Datos |
| --- | --- |
| `categories`, `services` | Catálogo, precio, capacidad, horario y tipo de QR. |
| `users`, `sessions` | Cuentas locales (hash de contraseña, rol) y sesiones; incluye las tres cuentas de demo listadas arriba. |
| `reservations` | Cliente, servicio, turno, totales, estado y vencimiento del bloqueo. |
| `payments`, `qrs` | Pago de prueba y QR generados. |
| `employees` | Operadores activos y servicio asignado. |
| `closures` | Cierres globales o asociados a un servicio. |
| `accessLogs` | Historial de intentos de lectura de QR. |
| `termsVersion` | Versión de términos que queda ligada a la reserva. |

El adaptador JSON sirve para demo de una sola instancia y desarrollo local; no sustituye PostgreSQL para concurrencia, despliegues serverless ni persistencia compartida entre máquinas. Usar solo información ficticia. Para reiniciar el estado, respaldar el archivo y restaurar el seed versionado: esto elimina cuentas y operaciones creadas localmente.

## Modelo relacional y conexión futura

El equipo decidió PostgreSQL con Prisma code-first. `prisma/schema.prisma` contempla roles, usuarios, categorías, servicios, horarios, membresías, cierres, empleados, reservas, aceptación de términos, pagos, QR y accesos. La migración inicial está en `prisma/migrations/20261005120000_initial_booking_platform/`.

Cuando estén disponibles las credenciales del PostgreSQL compartido:

1. Definir localmente `DATABASE_URL` y `DIRECT_URL` en `.env.local`; no versionar secretos.
2. Ejecutar `npx prisma validate` y `npm run db:generate`.
3. Aplicar la migración con `npm run db:migrate` y comprobar las tablas.
4. Migrar los repositorios y acciones feature por feature del adaptador JSON/mocks a Prisma, manteniendo contratos de servicio.
5. Antes de retirar el JSON, resolver bloqueo transaccional para evitar sobreventa cuando coincidan reservas y preparar seeds del catálogo demo.

Prisma es el ORM relacional acordado; no añadir lecturas de dominio duplicadas usando `.from()` de Supabase. Las variables `NEXT_PUBLIC_SUPABASE_*` son para Auth/OAuth y no son secretos. No exponer nunca una service-role key en el navegador.

## Mapa del repositorio

| Directorio/archivo | Responsabilidad |
| --- | --- |
| `src/app/` | Rutas, layouts, estilos globales y API route handlers. |
| `src/features/auth/` | Formularios, servicio de Auth, rutas de login/register, hash y sesiones JSON, OAuth opcional. |
| `src/features/reservations/` | Disponibilidad, formulario, acción de crear reserva y checkout de demo. |
| `src/features/categories/`, `src/features/services/` | Catálogo y administración de espacios/categorías. |
| `src/features/employees/`, `src/features/schedules/` | Empleados y cierres de operación. |
| `src/features/access-control/` | Validación y registro de acceso QR. |
| `src/shared/lib/demo-store.ts` | Modelo y adaptador serializado del JSON compartido. |
| `src/shared/components/` | Header, footer y componentes comunes del catálogo. |
| `src/shared/lib/supabase/` | Cliente Supabase para OAuth/recuperación cuando se configure. |
| `prisma/schema.prisma`, `prisma/migrations/` | Modelo code-first y cambios SQL versionados. |
| `data/elite-club-demo.json` | Estado/seed global de la demo local. |

Mantener lógica dentro de su feature; mover a `src/shared/` únicamente lo que sea realmente reutilizable.

## HU recomendadas para continuar

1. **BD real:** conectar catálogo, Auth/perfiles y horarios a Prisma; generar seed con las categorías/servicios demo.
2. **Reserva concurrente:** proteger el último cupo mediante transacción/bloqueo; definir expiración de holds y limpieza de reservas vencidas.
3. **Auth y permisos:** unificar identidad email/OAuth en almacenamiento productivo; autorización por rol para administración, empleado y cliente; completar recuperación de contraseña.
4. **Pagos reales:** integrar Stripe Checkout/Payment Intent, webhook idempotente, fallos/reintentos y confirmación del QR solo tras pago aprobado.
5. **Mis reservas:** asociar al ID de usuario (la demo actualmente filtra por correo) y acordar cancelaciones/reembolsos.
6. **Membresía:** confirmar porcentaje, vigencia, límites y casos del descuento con el cliente; persistir desglose aplicado.
7. **Administración y operación:** proteger rutas por rol, completar validaciones/estados de formularios y conservar auditoría de cambios.
8. **Pruebas:** unitarias para reglas de disponibilidad/precios/expiración; integración para Auth/reserva/pago/QR; E2E de recorridos críticos.
9. **Cierre con cliente:** validar diseño responsive, accesibilidad, contenido legal/privacidad y reglas de negocio pendientes.

## Flujo Git del equipo

Seguir [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) para ramas y Pull Requests. Integrar HU en `develop` por PR revisable. Antes de entregar una HU, ejecutar lint y typecheck, explicar cambios de datos/API y no incluir `.env*`, contraseñas, tokens ni información real de usuarios.
