# PEDG-39 · Expiración automática de bloqueos de 10 minutos

Rama: `Nicolas-feature/PEDG-39/Expiracion-bloqueos`

## Qué se hizo

Cuando un cliente reserva, el cupo queda bloqueado 10 minutos mientras paga (`Reserva.bloqueo_expira_en`). La disponibilidad ya ignoraba los bloqueos vencidos, pero la reserva seguía en `pendiente_pago` hasta que el cliente abría "Mis reservas".

Ahora existe un endpoint que el cron del servidor llama cada 5 minutos. Marca como `expirada` toda reserva `pendiente_pago` con el bloqueo vencido.

Además, el pago demo ya no se queda en silencio si el bloqueo vence justo mientras el cliente paga: le muestra "El bloqueo venció".

## Archivos tocados

- `src/app/api/cron/expire-reservations/route.ts` (nuevo): endpoint `GET` protegido con `CRON_SECRET`.
- `src/features/reservations/services/reservation.service.ts`:
  - nueva función `expireStaleReservations()`;
  - `completeDemoPayment` revisa el vencimiento dentro de la transacción.
- `.env.example`: variable nueva `CRON_SECRET`.

## Cómo funciona el endpoint

| Petición | Respuesta |
|---|---|
| Sin `CRON_SECRET` configurado en el servidor | `503`: el job está apagado |
| Sin cabecera o con un token incorrecto | `401` |
| `Authorization: Bearer <CRON_SECRET>` | `200 {"expired": N}`, donde N es el número de reservas marcadas |

- Es idempotente: si se llama dos veces seguidas, la segunda devuelve `0`.
- Nunca toca reservas `pagada`, porque solo actualiza las que están en `pendiente_pago` con el bloqueo vencido.

## Cómo activarlo en el servidor (lo hace quien despliegue, PEDG-40)

1. Generar el secreto y guardarlo como variable de entorno `CRON_SECRET` en el servidor:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Agregar al crontab del VPS (`crontab -e`):

   ```cron
   */5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/expire-reservations > /dev/null
   ```

   `$CRON_SECRET` debe estar disponible en el entorno del cron; si no, se escribe el valor directamente en la línea.

En el plan gratuito de Vercel los crons solo pueden correr una vez al día, por eso la programación cada 5 minutos se hace en el VPS.

## Cómo probarlo

1. `npm run build` y luego `CRON_SECRET=prueba npx next start`.
2. `curl -i http://localhost:3000/api/cron/expire-reservations` debe responder `401`.
3. `curl -H "Authorization: Bearer prueba" http://localhost:3000/api/cron/expire-reservations` debe responder `{"expired":N}`. Una segunda llamada debe responder `{"expired":0}`.
4. Prueba completa: reservar un turno, no pagarlo, esperar 10 minutos y llamar al endpoint. La reserva pasa a "expirada" en "Mis reservas" y el cupo sigue libre en la disponibilidad.

Validado el 7/10:
- `lint`, `typecheck` y `build` pasan sin errores.
- Respuestas `401` y `200` comprobadas.
- Como la base no tenía bloqueos vencidos en ese momento, la prueba no modificó datos.

## Decisiones y pendientes

- **Pago aprobado después de vencer el bloqueo (criterio 3): pendiente.**
  - Hoy el pago demo lo rechaza.
  - La regla definitiva depende de la pasarela real (PEDG-35, Wompi) y de lo que se acuerde con el cliente.
- La disponibilidad no necesitó cambios: ya contaba solo las reservas `pagada` y las `pendiente_pago` vigentes.

## Texto sugerido para el PR

> **PEDG-39 · Expiración automática de bloqueos**
>
> - Agrega `GET /api/cron/expire-reservations`, protegido con `CRON_SECRET`, que marca como `expirada` las reservas no pagadas con el bloqueo vencido. Es idempotente y no toca reservas pagadas.
> - El pago demo muestra "El bloqueo venció" si el bloqueo expira durante el checkout.
> - Documenta `CRON_SECRET` en `.env.example` y la línea de crontab para el VPS (ver `docs/sprint-2/PEDG-39.md`).
>
> Pruebas: lint, typecheck y build; endpoint con 401 y 200 verificado localmente.
