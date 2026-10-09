# PEDG-35 · Pago en línea con Wompi (sandbox)

Rama: `feature/wompi-payments-email-qr`

## Qué se hizo

El cliente paga su reserva con tarjeta, PSE o Nequi a través del checkout de Wompi en sandbox. Al crear el pago se genera una referencia única y se abre el checkout seguro; el webhook confirma el resultado.

- `src/shared/lib/wompi.ts` (nuevo): firma de integridad SHA256 (`referencia + monto + moneda + secreto`) y validación del checksum de eventos (`propiedades + timestamp + secreto`).
- `src/features/payments/services/payment.service.ts` (nuevo): `createWompiPayment` crea un `Pago` en `pendiente` con `pasarela = "wompi"` (reutiliza el pendiente existente para no duplicar); `confirmWompiPayment` es idempotente y solo actualiza pagos en `pendiente`.
- `src/app/api/wompi/webhook/route.ts` (nuevo): `POST` valida `X-Event-Checksum` con `WOMPI_EVENTS_SECRET` y aplica `transaction.updated`.
- `src/app/api/wompi/return/route.ts` (nuevo): `GET` redirige al `/checkout/:id` tras volver del checkout.
- `src/features/payments/api/payment.actions.ts` + `components/wompi-payment-button.tsx` (nuevos): el checkout crea el pago pendiente y muestra el formulario hacia `https://checkout.wompi.co/p/` con `public-key`, `currency`, `amount-in-cents`, `reference`, `signature:integrity`, `redirect-url` y `customer-data:email`.
- Limpieza: se eliminó `/api/stripe/webhook` y `src/shared/lib/stripe.ts`; el checkout ya no menciona Stripe.
- El pago demo (`completeDemoPayment`) se mantiene como respaldo.

## Reglas cumplidas

- Referencia única por pago (`WOMPI-XXXXXXXX`).
- Webhook idempotente: ignora eventos repetidos o pagos ya resueltos.
- Aprobado: `Pago.aprobado` + `Reserva.pagada` + QR generados (individual = uno por persona, grupal = uno por reserva) + correo con QR.
- Rechazado: `Pago.fallido`; la reserva sigue `pendiente_pago` hasta que vence el bloqueo de 10 minutos (cron PEDG-39), así se puede reintentar.

## Cómo probarlo

1. Configurar en `.env`: `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`, `APP_URL` (ver `.env.example`).
2. En el dashboard Wompi sandbox, registrar el webhook `https://<dominio>/api/wompi/webhook`.
3. Reservar un turno, pulsar "Pagar en línea con Wompi", completar en el sandbox con tarjeta/PSE/Nequi.
4. Verificado: `lint`, `typecheck`, `build`.
5. Webhook manual: reenviar el mismo evento dos veces debe devolver el mismo `status` sin duplicar QR.

## Pendientes

- Claves reales de sandbox y dominio con HTTPS (PEDG-40); en local sin claves el botón muestra el aviso y se usa el pago demo.
- Regla de pago aprobado después de vencer el bloqueo: hoy se marca `fallido` (igual que el demo); falta acuerdo con el cliente.
