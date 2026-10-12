# PEDG-29 (HU-43) · Proveedor de correo transaccional (Resend)

Rama: `feature/wompi-payments-email-qr`

## Qué se hizo

- `src/shared/lib/email.ts`: `isEmailEnabled()` + `sendEmail()` contra la API REST de Resend (`POST https://api.resend.com/emails`) con `fetch` nativo, sin SDK nuevo. Nunca lanza: los fallos se registran en consola y devuelven `{ delivered: false }` para no revertir pagos.
- `.env.example`: `RESEND_API_KEY`, `EMAIL_FROM` documentadas. Sin ellas la app sigue funcionando y los correos se omiten con un aviso en logs (modo degradado para la demo).
- Sin cambios de esquema ni migraciones.

## Cómo probarlo

1. Crear API key en https://resend.com/api-keys y un remitente verificado; copiar a `.env` (`RESEND_API_KEY`, `EMAIL_FROM`).
2. Reservar y pagar (demo o Wompi): el correo de QR debe llegar al `correo_comprobante`.
3. Sin variables: pagar igual funciona, en consola aparece `[email] Resend is not configured; skipping...`.
4. Verificado: `lint`, `typecheck`, `build`.

## Pendientes

- Verificar dominio propio y remitente de producción (PEDG-40).
- Reutilizar `sendEmail()` para HU-13 (verificación) y HU-15 (recuperación) cuando Alfredo las retome.
