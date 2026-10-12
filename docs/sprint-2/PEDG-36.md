# PEDG-36 · QR por correo al confirmar el pago

Rama: `feature/wompi-payments-email-qr`

## Qué se hizo

- `src/features/payments/services/qr-mail.service.ts` (nuevo): `sendReservationQrEmail(reservaId)` lee la reserva pagada con servicio, cliente, pago aprobado y QR; genera imágenes QR con la paleta del proyecto y envía el correo al `correo_comprobante`.
- El correo incluye: servicio, fecha (Bogotá), franja horaria, referencia de pago, cantidad de QR, regla de menores (con adulto responsable) cuando aplica, y una tarjeta por código con imagen + código alfanumérico.
- Se dispara tras aprobar el pago en los dos caminos: `confirmWompiPayment` y `completeDemoPayment` (pago demo). Va fuera de la transacción y con `.catch`: un fallo de correo nunca revierte el pago, queda en logs para reintento manual.
- Plantilla con la paleta Élite Club (`#0B0F15`, `#121824`, `#0085FF`, `#F7F9FC`, `#94A3B8`), layout de tablas y estilos en línea para clientes de correo.

## Cómo probarlo

1. Con `RESEND_API_KEY` y `EMAIL_FROM` configurados, pagar una reserva (demo o Wompi sandbox).
2. Revisar el correo: asunto `Tus QR de <servicio> · <fecha> <hora>` con las tarjetas QR.
3. Probar QR individual (varios códigos) y grupal (un código).
4. Probar reserva con menores: debe aparecer la regla con el adulto responsable.
5. Con Resend sin configurar: el pago y los QR en pantalla funcionan igual; en consola queda `[email] ... not delivered`.
6. Verificado: `lint`, `typecheck`, `build`.

## Pendientes

- Sin tabla de reintentos de correo en este PR (evita migraciones en la base compartida); hoy el reintento es manual reenviando desde los logs. Proponer outbox como HU aparte si el cliente lo pide.
