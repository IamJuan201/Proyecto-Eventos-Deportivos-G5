# PEDG-21 (HU-13) · Verificación de correo con OTP de 8 dígitos

Rama: `feature/wompi-payments-email-qr` (comparte rama con PEDG-35/29/36 por depender del correo).

> Nota: en el tablero PEDG-21 figura a nombre de Alfredo. Este PR implementa la verificación por OTP según lo pedido; coordinar con él para no duplicar HU-13/HU-15.

## Qué se hizo

Registro y login por correo ahora exigen confirmar el correo con un código de 8 dígitos enviado por email (usa `sendEmail` de PEDG-29, así se prueba el correo en serio).

- `prisma/schema.prisma` + `prisma/migrations/20261008120000_otp_verificacion/migration.sql` (nuevo): tabla `CodigoOtp` (un código activo por usuario, hash SHA256, expiración, intentos, último envío, FK cascade a `Usuario`). La migración incluye backfill `correo_confirmado = true` para no bloquear cuentas existentes.
- `src/features/auth/services/otp.service.ts` (nuevo): `issueOtpCode`, `verifyOtpCode` (un solo uso, 5 intentos, expira por `OTP_EXPIRY_MINUTES`), `resendOtpCode` (espera `OTP_RESEND_COOLDOWN_MINUTES`, error 429 con `retryAfterSeconds`), plantilla de correo con la paleta del proyecto.
- `POST /api/auth/register`: ya no abre sesión; crea el usuario, emite el OTP y devuelve `emailConfirmationRequired`.
- `POST /api/auth/login`: con contraseña válida pero correo sin confirmar responde 403 con `emailConfirmationRequired` (reemite el código solo si no hay uno activo) y **no** abre sesión.
- Nuevos `POST /api/auth/verify-otp` (verifica, confirma y abre sesión) y `POST /api/auth/resend-otp` (429 con `retryAfterSeconds` dentro de la espera).
- Página `/verify-email?email=&reason=register|login&next=`: mismo formulario en ambos casos, con texto distinto (registro: bienvenida; login: "cerraste la verificación antes de terminar"), cuenta regresiva de vencimiento y de reenvío, input numérico de 8 dígitos con `autocomplete="one-time-code"`.
- `.env.example`: `OTP_EXPIRY_MINUTES="15"`, `OTP_RESEND_COOLDOWN_MINUTES="4"`.
- Empleados y OAuth no cambian: nacen con `correoConfirmado = true`.

## Cómo probarlo

1. Aplicar la migración contra la base (`npx prisma migrate deploy`; es aditiva: crea `CodigoOtp` + backfill; **no** correr `migrate dev`/`db push` contra la base compartida sin avisar, ver reglas de `INICIO-SPRINT-2.md`).
2. Con `RESEND_API_KEY` y `EMAIL_FROM` en `.env`, registrarse en `/register`: llega el correo con el código, la app muestra `/verify-email`; ingresar el código entra al dashboard.
3. Cerrar la pestaña sin verificar e intentar login: vuelve a `/verify-email` con el texto de continuación.
4. Pedir otro código dos veces seguidas: la segunda responde espera de 4 min (429 + contador en pantalla).
5. Ingresar un código vencido o con 5 fallos: pide uno nuevo.
6. Verificado: `lint`, `typecheck`, `build`.

## Pendientes

- Coordinar con Alfredo (PEDG-21/HU-13 y PEDG-23/HU-15 recuperación) para que la recuperación reuse `sendEmail` y no choque con este flujo.
- Sin tabla de auditoría de intentos; el reintento de correo fallido es manual.
