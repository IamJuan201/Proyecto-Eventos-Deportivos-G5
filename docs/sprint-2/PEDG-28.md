# PEDG-28 (HU-21) · Visualización de horarios y disponibilidad en tiempo real

Rama: `Nicolas-feature/PEDG-28/Cupos-en-tiempo-real`

## Qué se hizo

El formulario de reserva (detalle de un servicio, sesión de cliente) ya mostraba los turnos libres con sus cupos, pero solo los consultaba al abrir la página o al cambiar la fecha. Si otro cliente reservaba mientras tanto, la pantalla quedaba desactualizada.

Ahora el formulario vuelve a consultar la disponibilidad:

- **cada 30 segundos**, mientras la pestaña está visible;
- **apenas el cliente vuelve a la pestaña**.

Esto incluye los turnos que se llenan, los bloqueos de pago que vencen y los turnos de hoy que ya empezaron.

Reglas del refresco:

- **Si el turno elegido se agota:** el refresco no lo cambia por otro. Deja la hora sin elegir y el botón "Continuar al pago" se deshabilita hasta que el cliente escoja otra.
- **Al abrir la página o cambiar de fecha:** se preselecciona el primer turno libre, igual que antes.
- **Si un refresco falla** (red o despliegue): se conserva la última disponibilidad buena; no se vacía la grilla.

## Archivos tocados

- `src/features/reservations/components/booking-form.tsx` (solo el efecto que carga la disponibilidad y la constante `AVAILABILITY_REFRESH_MS`).

Sin dependencias nuevas, sin websockets y sin cambios en el servidor.

## Cómo se cumplen los criterios

| Criterio | Cómo |
|---|---|
| Ocultar turnos pasados, agotados o con bloqueos activos | Ya lo hacía `getAvailableSlots`: esos turnos quedan con 0 cupos y el formulario los oculta. Ahora también desaparecen sin recargar la página. |
| Cupos por bloque "en tiempo real" | Se muestran "N disp." y se actualizan cada 30 s. La reserva vuelve a validar el cupo dentro de una transacción con bloqueo, así que nunca se vende el último cupo dos veces. |

## Cómo probarlo

1. Abrir el mismo servicio en dos navegadores con dos cuentas de cliente distintas.
2. En el navegador A, anotar los cupos de un turno.
3. En el navegador B, reservar ese turno. No hace falta pagar: el bloqueo de 10 minutos ya ocupa el cupo.
4. En A, sin recargar, en menos de 30 segundos el turno baja sus cupos o desaparece.
5. Si en A estaba elegido ese turno y se agotó, la hora queda sin elegir y el botón se deshabilita.

Validado el 7/10:
- `lint`, `typecheck` y `build` pasan.
- La página de detalle carga como cliente (200) y el refresco va incluido en el JavaScript del cliente.
- La prueba con dos navegadores (pasos de arriba) no se hizo porque crea reservas en la base compartida.

## Decisiones y pendientes

- **"Tiempo real" = consultas cada 30 s:** basta porque la reserva valida el cupo en la base. Supabase Realtime o websockets serían más complejos de lo que pide la HU.
- **Carga en el servidor:** cada formulario abierto y visible hace una consulta liviana cada 30 s. Solo lo ven los clientes con sesión.
- **Mejoras posibles, no incluidas:**
  - mostrar un aviso "Tu turno se agotó, elige otro" cuando se limpia la selección;
  - limitar el selector de cantidad a los cupos que quedan (hoy el servidor lo rechaza con "Quedan N cupos").
- La HU estaba asignada a Jonathan. Nicolás la tomó el 7/10.

## Texto sugerido para el PR

> **PEDG-28 (HU-21) · Cupos en tiempo real**
>
> - El formulario de reserva refresca la disponibilidad cada 30 s mientras la pestaña está visible y al volver a ella.
> - Si el turno elegido se agota, se limpia la selección en vez de cambiarla por otra. Un refresco fallido conserva el último estado.
> - Solo cambia `booking-form.tsx`; sin dependencias nuevas.
>
> Pruebas: lint, typecheck y build; página de detalle verificada como cliente.
