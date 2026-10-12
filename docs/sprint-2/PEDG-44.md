# PEDG-44 · Los días festivos aparecían disponibles para reservar

Rama: `Nicolas-feature/PEDG-44/Festivos-sin-reservas`

## Qué se hizo

**Regla del negocio:** en festivos el complejo no abre.

La tabla `Festivo` ya existía, pero ningún código la consultaba, así que un festivo se podía reservar como cualquier día. Ahora se consulta en dos puntos:

- **Disponibilidad:** un festivo no muestra turnos. El formulario dice "No hay turnos disponibles para esta fecha".
- **Crear la reserva:** si alguien intenta reservar un festivo, recibe "El complejo no abre en días festivos. Elige otra fecha."

Además:

- Se cargaron los festivos de Colombia de 2027. Antes solo había de oct–dic 2026, así que desde el 17/12 la ventana de reserva habría entrado en días sin datos.
- La pista del formulario de reserva ahora dice "El complejo cierra los lunes y los festivos".

## Archivos tocados

- `src/features/schedules/services/closure.service.ts`: nueva función `isHoliday(date)`, junto a la de cierres.
- `src/features/reservations/services/reservation.service.ts`: usa `isHoliday` en la disponibilidad y al crear la reserva.
- `src/features/reservations/components/booking-form.tsx`: texto de la pista.
- `prisma/seed/datos.json`: 18 festivos de 2027 con UUID fijos.

## Datos en la base compartida

**No hay que hacer nada.** El 7/10 se insertaron en Supabase **solo** las 18 filas de 2027 en la tabla `Festivo`, con `ON CONFLICT DO NOTHING`. No se modificó ni borró ninguna otra fila. La tabla quedó con 5 festivos de 2026 y 18 de 2027.

Las fechas de 2027 se calcularon a partir de la Pascua (28/03/2027) y de la Ley Emiliani, que pasa al lunes los festivos que no caen en lunes.

**Antes de diciembre de 2027** hay que cargar los de 2028 en `datos.json` e insertarlos de la misma forma.

No conviene correr el seed completo contra la base compartida: actualiza todas las tablas con los valores del archivo.

## Cómo probarlo

Hoy el único festivo dentro de la ventana de reserva (hoy + 15 días) es el lunes 12/10, y los lunes ya estaban cerrados. Por eso en la app el cambio solo se nota con un festivo que caiga entre semana: el 8/12 (martes) o el 25/12 (viernes), que entran en la ventana desde el 23/11 y el 10/12.

Validado el 7/10 con el reloj simulado en el 1/12/2026, sin crear reservas:

| Caso | Resultado |
|---|---|
| Turnos del martes 8/12 (festivo) en "Cancha fútbol 11" | 0 |
| Turnos del miércoles 9/12 | 9 (normal) |
| Crear una reserva el 8/12 | Error: "El complejo no abre en días festivos. Elige otra fecha." |

Además:

- `isHoliday` devuelve `true` para 12/10, 8/12 y 25/12, y `false` para días normales y fechas mal escritas.
- `lint`, `typecheck` y `build` pasan.

## Decisiones y pendientes

- **Orden de las revisiones:** un festivo que cae en lunes, o en un día en que el servicio no opera, muestra "Este espacio está cerrado el día seleccionado", porque esa revisión va primero. Es cosmético.
- **Fuente oficial de festivos:** la tabla `Festivo`. El tipo de cierre "festivo" en `/admin/schedules` sigue existiendo para cierres puntuales, pero ya no hace falta registrar ahí los festivos nacionales.
- No hay pantalla de admin para editar `Festivo`. Se carga por datos.

## Texto sugerido para el PR

> **PEDG-44 · Festivos sin reservas**
>
> - La disponibilidad y la creación de reservas consultan la tabla `Festivo`: los festivos no muestran turnos y no aceptan reservas.
> - Agrega al seed los festivos de Colombia de 2027 (ya insertados en la base compartida, solo en `Festivo`).
> - Actualiza la pista del formulario de reserva.
>
> Pruebas: lint, typecheck y build; regla verificada con el reloj simulado (martes 8/12/2026) sin escribir reservas.
