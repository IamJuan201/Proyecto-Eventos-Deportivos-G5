# PEDG-31 (HU-32) · Administración de cuentas de empleado

Rama: `Nicolas-feature/PEDG-31/Credenciales-empleado`

## Qué se hizo

En `/admin/employees` el admin ya podía crear empleados, activarlos o desactivarlos y reasignarles servicio. Faltaba **cambiar las credenciales**. Por decisión del equipo, eso significa **solo la contraseña**; el correo no se cambia.

Ahora cada fila de empleado tiene un campo "Nueva contraseña" y un botón "Cambiar contraseña":

- La contraseña debe tener entre 8 y 128 caracteres.
- Se guarda con hash scrypt, nunca en claro.
- Desde ese momento la contraseña anterior ya no sirve para iniciar sesión.

Además, se retiró el módulo viejo de empleados basado en la API de Supabase. No lo usaba ninguna pantalla, la base lo bloqueaba por RLS y `staff.service.ts` ya lo había reemplazado. Con esto la HU queda completa y no le queda nada pendiente a isai.

## Archivos tocados

- `src/features/employees/services/staff.service.ts`: nueva función `setStaffPassword`.
- `src/features/employees/api/employee.actions.ts`: nueva acción `changeEmployeePasswordAction`. Solo la puede usar un admin y valida la longitud.
- `src/app/(admin)/admin/employees/page.tsx`: el formulario de cambio de contraseña en cada fila.
- **Eliminados**, porque nadie los importaba (quedan en el historial de git):
  - `api/employee-service.factory.ts`
  - `services/employee.service.ts`
  - `services/employee.repository.ts`
  - `services/supabase-employee.repository.ts`
  - `services/employee.errors.ts`
  - `schemas/employee.schema.ts`
  - `types/employee.types.ts`
- `README.md` y `docs/BASE-DE-DATOS.md`: se quitaron las notas que hablaban de ese módulo como pendiente.

## Cómo cumple los criterios

| Criterio | Cómo |
|---|---|
| Crear un usuario con rol Empleado | Ya existía: "Agregar empleado" crea el `Usuario` con rol `empleado`, contraseña inicial y servicio. |
| Cambiar credenciales o desactivar, revocando el acceso inmediato | **Cambiar contraseña:** nuevo. **Desactivar:** ya existía y corta el acceso en la siguiente petición, porque el panel de empleado, el escáner y el login revisan en cada solicitud que el empleado esté activo. |

## Cómo probarlo

1. Entrar como admin y abrir `/admin/employees`.
2. En la fila de un empleado, escribir una contraseña nueva de 8 caracteres o más y pulsar "Cambiar contraseña".
3. Cerrar sesión. El empleado ya no entra con la contraseña anterior y sí con la nueva.
4. Pulsar "Desactivar": el empleado pierde el acceso al escáner de inmediato.

Validado el 7/10, sin escribir en la base compartida:

- El hash generado tiene el formato del login (`salt:hash`) y lo valida `verifyPassword`; una contraseña distinta se rechaza.
- `setStaffPassword` rechaza empleados inexistentes o ids inválidos.
- El panel muestra un formulario por empleado (`minLength` 8, `maxLength` 128).
- Sin sesión, `/admin/employees` redirige a `/login`; con la cuenta de cliente redirige a `/`.
- `lint`, `typecheck` y `build` pasan.
- El paso 3 (iniciar sesión con la contraseña nueva) no se ejecutó porque modifica la base compartida.

## Decisiones y pendientes

- **Las sesiones ya abiertas no se cierran al cambiar la contraseña.** La cookie de sesión solo guarda el id del usuario. Para cortar el acceso de inmediato hay que usar "Desactivar".
  - Cerrar también las sesiones exige tocar `session.ts`, que es auth (PEDG-21/23, Alfredo), o el esquema.
  - Queda para la migración a Supabase Auth (`docs/BASE-DE-DATOS.md` §4).
- **Login con Google o GitHub (para Alfredo):** si un empleado entra con un correo de Google o GitHub igual al suyo, el login no le pide contraseña, así que cambiarla no lo frena. Desactivarlo sí.
- **Quedaron sin uso**, pero no se tocaron para no cambiar dependencias:
  - `src/shared/lib/supabase/admin.ts`, que se necesitará en la migración a Supabase Auth;
  - la dependencia `zod`.

## Texto sugerido para el PR

> **PEDG-31 (HU-32) · Cambio de contraseña de empleados**
>
> - Agrega en `/admin/employees` el cambio de contraseña por empleado (solo admin, 8 a 128 caracteres, hash scrypt).
> - Retira el módulo de empleados basado en la API de Supabase, que no se usaba y estaba bloqueado por RLS. Todo pasa por `staff.service.ts`.
> - Actualiza README y `docs/BASE-DE-DATOS.md`.
>
> Pruebas: lint, typecheck y build; hash compatible con el login; panel y permisos verificados.
