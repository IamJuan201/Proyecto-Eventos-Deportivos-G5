# PEDG-26 (HU-19) · Gestión de franjas horarias y disponibilidad

Rama: `Nicolas-feature/PEDG-26/Franjas-con-reservas`

## Qué se hizo

En `/admin/services`, el admin elige los días de operación de cada servicio. Cada día marcado es una franja de 08:00 a 17:00 (tabla `HorarioServicio`). Antes, al quitar un día, se borraban sus franjas aunque hubiera clientes con reservas ese día.

Ahora, si el admin intenta quitar un día que tiene reservas activas de hoy en adelante, el formulario lo rechaza con un mensaje como este:

> No puedes quitar el sábado: hay reservas activas ese día desde hoy en adelante. Podrás quitarlo cuando esas reservas pasen.

Una reserva es "activa" si está pagada o si está pendiente de pago dentro de sus 10 minutos de bloqueo. Es la misma regla que usa la disponibilidad.

Agregar días, o quitar días sin reservas, funciona igual que antes.

## Archivos tocados

- `src/features/services/services/service.repository.ts`: método nuevo `bookedWeekDays(id)` en la interfaz.
- `src/features/services/services/prisma-service.repository.ts`: implementación. Busca las reservas activas del servicio desde hoy (hora de Bogotá) y devuelve sus días de la semana.
- `src/features/services/services/service.service.ts`: al actualizar un servicio compara los días que se quitan con los días reservados y lanza el error si coinciden.

No hay cambios de esquema, de pantallas ni de datos.

## Cómo probarlo

1. Entrar como admin y abrir `/admin/services`.
2. Editar un servicio que tenga una reserva pagada futura. En los datos demo, "Cancha fútbol 11" tiene una el sábado 10/10.
3. Desmarcar ese día y guardar: aparece el error y el servicio no cambia.
4. Desmarcar un día sin reservas y guardar: se guarda normalmente.

Validado el 7/10, sin escribir en la base compartida:

- Se usó un repositorio de prueba que lee la base real y bloquea cualquier escritura.
- Quitar el sábado o el miércoles de "Cancha fútbol 11" muestra el error.
- Quitar el domingo, que no tiene reservas, sí llega a guardar (la escritura quedó bloqueada por la prueba).
- `lint`, `typecheck` y `build` pasan.

## Decisiones y pendientes

- **Horario fijo de 08:00 a 17:00:** se mantiene como lo tiene el código. Hacer las horas configurables por servicio y día sería otra HU (tamaño L).
- **Lunes:** siguen cerrados por una regla del código (`MONDAY` en `reservation.service.ts`). La nota de Jira que decía que dependía de los datos no era correcta. El formulario sigue mostrando el lunes; por decisión de alcance no se ocultó.
- **Reservas de hoy que ya terminaron:** también cuentan hasta la medianoche. Es una decisión conservadora.
- **Carrera conocida, de bajo impacto:** si un cliente reserva justo en el mismo instante en que el admin quita ese día, la reserva podría quedar en un día sin operación. La ventana es de milisegundos. Cerrarla del todo exigiría compartir el bloqueo de la reserva con la edición del servicio.
- **Regla duplicada:** la definición de "reserva activa" está copiada de `blocking()` en `reservation.service.ts`. Si esa regla cambia, hay que cambiarla también aquí.

## Texto sugerido para el PR

> **PEDG-26 (HU-19) · No quitar días de operación con reservas activas**
>
> - Al editar un servicio, impide quitar un día de operación que tenga reservas activas (pagadas o en bloqueo de pago) de hoy en adelante y muestra el motivo en el formulario.
> - Agrega `bookedWeekDays` al repositorio de servicios.
> - Sin cambios de esquema ni de UI.
>
> Pruebas: lint, typecheck y build; regla probada contra la base de demo con un repositorio que bloquea las escrituras.
