# QA — Élite Club

Documento de seguimiento para compartir hallazgos y coordinar las pruebas de calidad del proyecto de eventos deportivos.

## 1. Objetivo

Registrar los comportamientos detectados durante QA, definir cómo reproducirlos y acordar criterios de aceptación antes de cerrar cada revisión.

## 2. Alcance de esta revisión

- Escaneo y validación de códigos QR.
- Estados de reservas, pagos y accesos.
- Membresías y su efecto en el precio de una reserva.
- Recuperación de contraseña.
- Expiración de reservas pendientes.

## 3. Resumen de hallazgos

| ID | Área | Hallazgo | Prioridad | Estado |
|---|---|---|---|---|
| QA-QR-01 | Escáner QR | Definir e implementar una pausa entre lecturas para evitar lecturas repetidas o demasiado rápidas. | Por acordar | Pendiente |
| QA-QR-02 | Escáner QR | La cámara se detiene después de detectar un QR y no se reactiva sin recargar la página. | Alta — propuesta | Pendiente |
| QA-EST-01 | Estados | Hace falta validar la presentación y transición de los estados de reserva, pago y acceso. | Por acordar | Pendiente |
| QA-MEM-01 | Membresías | La membresía existe en los datos, pero actualmente no se aplica a la reserva ni al precio. | Por acordar | Pendiente de definición funcional |
| QA-AUTH-01 | Recuperación de contraseña | El flujo actual cambia la contraseña en Supabase Auth, pero el login por correo valida el hash guardado en la tabla local `Usuario`. | Alta — propuesta | Hallazgo de revisión estática |
| QA-EST-02 | Pago | El checkout de demostración solo genera pagos aprobados; los estados `pendiente` y `fallido` no tienen un recorrido de prueba implementado. | Por acordar | Hallazgo de revisión estática |
| QA-RES-01 | Expiración | La reserva vencida se marca como `expirada` cuando se consulta el checkout o la lista de reservas; no se encontró un proceso programado que lo haga en segundo plano. | Por acordar | Limitación conocida por validar |

> Las prioridades son propuestas para organizar la revisión; el equipo debe confirmarlas.
>
> Los hallazgos marcados como revisión estática se deducen del flujo del código. Deben reproducirse en el entorno QA antes de cerrarlos como defectos confirmados.

## 4. Hallazgos y pruebas

### QA-QR-01 — Pausa entre lecturas del escáner

**Comportamiento esperado:** después de leer un código, el sistema muestra el resultado y aplica una pausa breve antes de aceptar otra lectura. La pausa debe evitar lecturas duplicadas accidentales sin hacer lento el flujo del empleado.

**Prueba sugerida:**

1. Abrir el escáner con una cuenta de empleado activa.
2. Enfocar un QR válido y observar si una lectura produce varios intentos o resultados.
3. Repetir con un QR inválido y con un QR ya utilizado.
4. Confirmar que se pueda escanear otro QR después de la pausa.

**Criterios de aceptación:**

- Una lectura física genera como máximo una validación.
- La interfaz indica cuándo está validando y cuándo vuelve a estar lista.
- El tiempo de pausa se acuerda con el equipo y puede ajustarse sin cambiar las reglas de acceso.
- Los errores y rechazos también permiten continuar con el siguiente código.

### QA-QR-02 — Mantener disponible la cámara después de validar

**Comportamiento observado:** al detectar un código, el escáner ejecuta `clear()`. El código queda en el formulario, pero la cámara se desmonta y no se inicia de nuevo automáticamente; para continuar hay que recargar la página.

**Prueba sugerida:**

1. Abrir `/scanner` como empleado.
2. Escanear un QR, completar la validación y observar el resultado.
3. Intentar escanear inmediatamente un segundo QR sin recargar la página.
4. Repetir los pasos con un QR válido, inválido, de otro servicio y ya utilizado.

**Criterios de aceptación:**

- La cámara permanece activa o se reactiva automáticamente después de mostrar cada resultado.
- El resultado de una lectura permanece visible hasta que llegue la siguiente lectura o el usuario lo cierre.
- El campo del código se limpia o selecciona para la siguiente lectura, según el diseño acordado.
- Una lectura rechazada no bloquea el escáner.
- Si el empleado detiene la cámara o el navegador pierde el permiso, la interfaz explica cómo reanudarla.

### QA-EST-01 — Validar estados y transiciones

El sistema maneja estados de reserva, pago y acceso. Conviene probar tanto el valor mostrado como las acciones disponibles para cada estado.

#### Estados de reserva

| Estado | Escenario que debe probarse | Resultado esperado |
|---|---|---|
| `pendiente_pago` | Crear una reserva y dejarla sin pagar. | Se muestra pendiente y se puede completar el pago mientras siga vigente el bloqueo de 10 minutos. |
| `pagada` | Completar el pago de prueba. | Se muestra confirmada y se generan los QR correspondientes al tipo de QR del servicio. |
| `expirada` | Dejar vencer el bloqueo de pago. | Se informa que venció el tiempo; el turno deja de ocupar cupo y no se puede completar el pago vencido. |

#### Estados de pago

| Estado | Escenario que debe probarse | Nota |
|---|---|---|
| `pendiente` | Revisar el estado antes de confirmar un pago, si existe un flujo que lo genere. | Confirmar si este estado debe mostrarse al cliente. |
| `aprobado` | Completar el pago de prueba. | Debe asociarse a la reserva y habilitar la emisión de QR. |
| `fallido` | Simular o preparar un pago rechazado. | Acordar cómo reintentar el pago y qué estado conserva la reserva. |

> El checkout actual es demostrativo y registra el pago como aprobado; los recorridos de pago pendiente y fallido requieren confirmación del equipo sobre cómo probarlos.

#### Resultados de acceso QR

Validar que la interfaz informe claramente cada resultado y que el código solo se consuma cuando el acceso es permitido.

| Resultado | Escenario |
|---|---|
| `permitido` | QR válido, reserva pagada, servicio correcto y turno vigente. |
| `qr_invalido` | Código inexistente. |
| `reserva_no_pagada` | Código asociado a una reserva que no está pagada. |
| `servicio_incorrecto` | Empleado intenta usar un QR de otro servicio. |
| `fuera_de_horario` | QR válido fuera de la fecha o del rango horario reservado. |
| `qr_usado` | Intentar validar por segunda vez un QR consumido. |
| `rechazado_menor` | En piscina, marcar que el menor mide menos de un metro. |

**Criterios de aceptación:**

- El estado visible coincide con el resultado registrado en la actividad del empleado.
- Solo `permitido` consume el QR.
- Los rechazos por QR inválido, servicio incorrecto, horario, pago o regla de menor no consumen el código.
- Un segundo intento de un QR ya consumido se identifica como `qr_usado`.
- Se prueban los cambios de estado en “Mis reservas” y en el checkout, además del registro interno.

### QA-MEM-01 — Membresías

**Comportamiento observado:** el modelo de datos contempla membresías con porcentaje, vigencia y estado activo; los datos de prueba incluyen una membresía. Sin embargo, al crear una reserva el código actual guarda `membresiaId` vacío, `descuento = 0` y `total = subtotal`. La documentación del proyecto también indica que el descuento aún no está implementado.

**Decisiones funcionales pendientes antes de cerrar este caso:**

- ¿Qué porcentaje de descuento aplica y sobre qué servicios o tipos de cobro?
- ¿La membresía debe estar activa y vigente en la fecha de la reserva, en la fecha de compra o en ambas?
- ¿Puede un cliente tener varias membresías vigentes? Si es así, ¿cuál se aplica?
- ¿El descuento se aplica automáticamente o el cliente debe seleccionarlo?
- ¿Cómo se muestra el subtotal, el descuento y el total en reserva, checkout e historial?
- ¿Qué ocurre con una reserva si la membresía vence después de reservar, pero antes del uso?

**Pruebas sugeridas cuando se confirme la regla:**

1. Cliente sin membresía.
2. Cliente con membresía activa y vigente.
3. Membresía inactiva.
4. Membresía fuera de su fecha de vigencia.
5. Reserva con cada tipo de cobro aplicable.
6. Verificar subtotal, porcentaje, descuento, total y datos guardados en la reserva.

**Criterio de aceptación:** el cálculo y la elegibilidad coinciden con la regla aprobada por el equipo y se reflejan de forma consistente en checkout, historial y base de datos.

### QA-AUTH-01 — Recuperación de contraseña no sincronizada con el login

**Hallazgo de revisión estática:** el formulario de recuperación usa `supabase.auth.resetPasswordForEmail()` y luego `supabase.auth.updateUser()` para cambiar la contraseña en Supabase Auth. En cambio, el login normal busca al usuario en PostgreSQL y compara la contraseña contra `Usuario.contrasena_hash`. El registro normal también crea el hash local y no crea una cuenta de Supabase Auth. Por eso, restablecer la contraseña por el flujo actual no actualiza la contraseña que verifica el login normal.

**Prueba sugerida:**

1. Crear una cuenta usando el registro normal por correo.
2. Solicitar recuperación de contraseña y completar el enlace recibido, si llega.
3. Intentar entrar con la contraseña nueva.
4. Confirmar también qué ocurre con cuentas OAuth y con cuentas de empleado.

**Resultado esperado:** una contraseña restablecida permite iniciar sesión en el mecanismo de autenticación usado por esa cuenta; el flujo comunica claramente si el correo no puede recuperarse.

**Criterio de aceptación:** recuperación y login actualizan/validan la misma fuente de credenciales o usan un único proveedor de autenticación de extremo a extremo.

### QA-EST-02 — Estados de pago sin simulación de pendiente o fallido

**Hallazgo de revisión estática:** el checkout de demostración marca la reserva como pagada, crea el pago con estado `aprobado` y emite los QR. No se encontró una acción de interfaz para producir un pago `pendiente` o `fallido`.

**Pendiente para el equipo:** decidir si los estados de pago fallido y pendiente deben formar parte del alcance actual. Si sí, definir cómo simularlos sin usar pagos reales y qué acciones verá el cliente: reintentar, esperar confirmación o cancelar.

**Criterio de aceptación:** todos los estados acordados pueden reproducirse y muestran una acción coherente; un pago fallido no emite QR ni marca la reserva como pagada.

### QA-RES-01 — Momento en que una reserva vencida cambia a `expirada`

**Hallazgo de revisión estática:** las reservas pendientes vencidas dejan de contar para la disponibilidad al terminar los 10 minutos. El cambio persistido a `expirada` ocurre al consultar esa reserva o listar las reservas del cliente. No se encontró un job que actualice el estado sin una consulta.

**Prueba sugerida:** crear una reserva pendiente, dejar vencer el bloqueo sin abrir el checkout ni “Mis reservas”, y revisar la disponibilidad y el estado persistido desde una herramienta autorizada de QA. Después abrir la reserva y comprobar si el estado cambia.

**Pendiente para el equipo:** confirmar si basta con que la disponibilidad ignore la reserva vencida o si se requiere que el estado en base de datos cambie dentro de un plazo definido aunque nadie la consulte.

## 5. Datos y condiciones para ejecutar QA

- Probar con cuentas de cliente y empleado autorizadas para el entorno usado.
- El empleado debe tener asignado un servicio activo para acceder al escáner.
- Para validar QR permitidos, usar reservas pagadas con fecha y hora vigentes.
- Probar QR de otro servicio, QR inexistentes y QR ya utilizados.
- No usar datos personales o credenciales reales en capturas ni en este documento.
- Registrar navegador, dispositivo, fecha, cuenta de prueba (rol, no contraseña), pasos, resultado observado y evidencia.

## 6. Referencias del proyecto

- Escáner: `src/features/access-control/components/scan/page.tsx`
- Validación de acceso: `src/features/access-control/services/access.service.ts`
- Estados y cálculo de reserva: `src/features/reservations/services/reservation.service.ts`
- Formulario de recuperación: `src/features/auth/components/password-reset-form.tsx`
- Login y creación de cuenta: `src/app/api/auth/login/route.ts` y `src/features/auth/lib/session.ts`
- Modelo de membresía y estados: `prisma/schema.prisma`
- Reglas funcionales conocidas: `README.md` y `docs/BASE-DE-DATOS.md`