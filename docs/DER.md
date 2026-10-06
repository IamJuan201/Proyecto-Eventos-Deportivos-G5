# DER v2 — Sistema de reservas, pago y control de acceso

Fuente de verdad del modelo de datos. Implementado en `prisma/schema.prisma`.

- Todas las PK son `uuid` con `DEFAULT gen_random_uuid()`.
- `?` = columna NULLABLE; el resto es NOT NULL.
- Fechas con hora: `timestamptz`. Horas de turno: `time`.

## Tablas

**Rol:** id pk, nombre varchar UNIQUE, descripcion varchar?, activo boolean

**Usuario:** id pk, rol_id fk→Rol, nombre varchar, correo varchar UNIQUE, contrasena_hash varchar?, proveedor_auth varchar (default `email`), correo_confirmado boolean, cedula varchar? UNIQUE, auth_id uuid? UNIQUE, activo boolean, creado_en timestamptz (default now())

**Empleado:** id pk, usuario_id fk→Usuario UNIQUE, servicio_id fk→Servicio, activo boolean, ultima_actividad timestamptz?, eliminado_en timestamptz?

**Membresia:** id pk, cliente_id fk→Usuario, descuento_porcentaje decimal, fecha_inicio date, fecha_fin date, activa boolean

**Categoria:** id pk, nombre varchar UNIQUE, descripcion varchar?, activa boolean

**Servicio:** id pk, categoria_id fk→Categoria, nombre varchar, descripcion varchar, precio decimal, tipo_cobro TipoCobro, capacidad_por_hora int, capacidad_personas int (default 20), tipo_qr TipoQR, imagen_url varchar?, activo boolean

**HorarioServicio:** id pk, servicio_id fk→Servicio, dia_semana smallint, hora_inicio time, hora_fin time, activo boolean · UNIQUE(servicio_id, dia_semana, hora_inicio)

**CierreServicio:** id pk, servicio_id fk→Servicio? (null = todo el complejo), fecha_inicio timestamptz, fecha_fin timestamptz, motivo varchar, tipo TipoCierre, creado_por fk→Usuario, activo boolean

**Festivo:** id pk, fecha date UNIQUE, nombre varchar

**Reserva:** id pk, cliente_id fk→Usuario, servicio_id fk→Servicio, membresia_id fk→Membresia?, fecha date, hora_inicio time, hora_fin time, cantidad_horas int, cantidad_cupos int, cantidad_personas int (default 1), contiene_menores boolean (default false), adulto_responsable varchar?, estado EstadoReserva, bloqueo_expira_en timestamptz?, subtotal decimal, descuento decimal (default 0), total decimal, creada_en timestamptz (default now())

**TerminosAceptados:** id pk, cliente_id fk→Usuario, reserva_id fk→Reserva UNIQUE, version_terminos varchar, aceptado_en timestamptz (default now())

**Pago:** id pk, reserva_id fk→Reserva, pasarela varchar (default `wompi`), referencia varchar UNIQUE, transaccion_id varchar? UNIQUE, monto decimal, medio_pago varchar?, estado EstadoPago, fecha_pago timestamptz?, nombre_comprobante varchar, cedula_comprobante varchar, correo_comprobante varchar

**QR:** id pk, reserva_id fk→Reserva, codigo varchar UNIQUE, tipo TipoQR, usado boolean, fecha_uso timestamptz?

**RegistroAcceso:** id pk, qr_id fk→QR? (null si el código no existe), empleado_id fk→Empleado, servicio_id fk→Servicio, resultado ResultadoAcceso, fecha_hora timestamptz (default now()), codigo_leido varchar?

## Enums

- **TipoCobro:** `por_persona` | `por_hora`
- **TipoQR:** `individual` | `grupal` (Servicio.tipo_qr y QR.tipo)
- **EstadoReserva:** `pendiente_pago` | `pagada` | `expirada`
- **EstadoPago:** `pendiente` | `aprobado` | `fallido`
- **TipoCierre:** `mantenimiento` | `festivo` | `evento_privado`
- **ResultadoAcceso:** `permitido` | `rechazado_menor` | `qr_invalido` | `reserva_no_pagada` | `servicio_incorrecto` | `fuera_de_horario` | `qr_usado`

## Relaciones (1 → muchos, salvo indicación)

Rol→Usuario · Usuario↔Empleado (1 a 1) · Servicio→Empleado · Usuario→Membresia · Membresia→Reserva (opcional) · Categoria→Servicio · Servicio→HorarioServicio · Servicio→CierreServicio (opcional) · Usuario→CierreServicio (creado_por) · Usuario→Reserva · Servicio→Reserva · Usuario→TerminosAceptados · Reserva↔TerminosAceptados (1 a 1) · Reserva→Pago (reintentos) · Reserva→QR · QR→RegistroAcceso (opcional) · Empleado→RegistroAcceso · Servicio→RegistroAcceso

## Restricciones fuera de Prisma

- **Un empleado activo por servicio:** índice único parcial `Empleado(servicio_id) WHERE activo = true AND eliminado_en IS NULL` (SQL manual en la migración).

## Pasarela de pago

Wompi (Colombia: tarjetas, PSE, Nequi), modelada de forma genérica para poder cambiarla:

- `referencia`: la genera el sistema al crear el `Pago` y se envía a la pasarela.
- `transaccion_id`: lo devuelve la pasarela por webhook. Al ser UNIQUE y actualizarse solo si el pago sigue `pendiente`, el webhook es idempotente.
- `medio_pago`: se conoce al confirmar (tarjeta, PSE, Nequi).
- Una reserva admite varios `Pago` (reintentos dentro del bloqueo de 10 minutos).

## Cambios frente al DER v1

| Cambio | Motivo |
|---|---|
| `Reserva.cantidad_personas`, `contiene_menores`, `adulto_responsable` | Validar `capacidad_personas` en canchas, métricas de personas y regla de menores. |
| `Usuario.contrasena_hash?`, `Usuario.cedula?` | Registro con proveedor externo (sin contraseña ni cédula). |
| Tabla `Festivo` | Lunes festivo abre y martes cierra por mantenimiento. |
| `Pago`: `pasarela`, `referencia`, `transaccion_id`, `medio_pago?`; sin `stripe_payment_id`; varios pagos por reserva | Stripe no opera en Colombia; Wompi; webhook idempotente y reintentos. |
| `Usuario.auth_id?` | Enlace futuro con Supabase Auth (correo confirmado y proveedores externos). |
| `Categoria.descripcion?`, `Servicio.imagen_url?` | El catálogo público las muestra. |
| `CierreServicio.servicio_id?` | Cierres de todo el complejo en una sola fila. |
| `RegistroAcceso.codigo_leido?` | Auditar qué se escaneó cuando el QR no existe. |
| `TerminosAceptados.reserva_id` UNIQUE | Una aceptación por reserva. |
| `Rol.descripcion?`, `Categoria.nombre` UNIQUE, `Servicio.capacidad_personas` con default 20, UNIQUE en `HorarioServicio`, `TipoCierre.evento_privado`, `time` sin fracciones | Se mantiene la lógica ya implementada en el proyecto. |
| Índice parcial con `activo = true` | Coincide con la regla "1 empleado **activo** por servicio". |
