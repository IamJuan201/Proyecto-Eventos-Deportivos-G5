# Perfil editable, términos y documento desde el registro · Élite Club

Rama de integración: `Nicolas-test/Perfil-registro-integracion` → PR hacia `develop`.
Sin migraciones: se usa el campo `Usuario.cedula`, que ya existía.

## Resumen

| # | Cambio | Para quién | Rama |
|---|---|---|---|
| 1 | Los términos y condiciones del registro se abren en una pestaña y el servidor exige aceptarlos | Visitante | `Nicolas-fix/Registro/Terminos-enlace` |
| 2 | El documento se pide al registrarse y la reserva usa siempre el de la cuenta | Cliente | `Nicolas-fix/Registro/Documento-desde-registro` |
| 3 | El perfil permite editar nombre, documento y correo | Todos | `Nicolas-feature/Perfil/Editar-datos` |

Validación: `lint` sin errores (2 advertencias heredadas), `typecheck`, `build`, validaciones del registro por API, perfil y reserva renderizados por rol, lógica del cambio de correo probada sin escribir en la base, y capturas en 390 y 1280 px sin desborde.

---

## 1. Términos y condiciones en el registro

**Qué cambia:** el texto "Acepto los términos y condiciones" enlaza a `https://policies.google.com/terms` en el idioma activo (`hl=es` o `hl=en`) y se abre en una pestaña nueva. La ruta `/api/auth/register` responde 400 si no llega `acceptedTerms: true`.

**Archivos:** `src/features/auth/components/auth-forms.tsx`, `src/app/api/auth/register/route.ts`, `src/features/auth/services/auth.service.ts`.

**Cómo probarlo:** en `/register`, el enlace abre los términos en otra pestaña sin marcar la casilla; sin la casilla el formulario no se envía.

**Pendiente:** el registro con Google o GitHub no pasa por esta casilla.

## 2. Documento desde el registro

**El problema:** la reserva pedía el documento cada vez. La primera reserva lo guardaba en la cuenta y, si después el cliente escribía otro (o el mismo con puntos), la reserva fallaba con "El documento no coincide".

**Qué cambia:**
- El registro pide "Número de documento". Se normaliza (sin puntos, espacios ni guiones, en mayúsculas) y debe tener de 5 a 20 letras o números.
- El documento es único: si ya existe, el registro responde "Ese documento ya está registrado en otra cuenta".
- La reserva muestra el documento de la cuenta con un enlace al perfil. Solo las cuentas antiguas o de Google/GitHub sin documento lo escriben una vez al reservar.
- El pago (Wompi y comprobante) sigue usando `Usuario.cedula`, así que siempre coincide.

**Archivos:** `src/features/auth/lib/document.ts` (regla compartida), `user.service.ts`, `session.ts`, `reservation.service.ts`, `booking-form.tsx`, `services/[serviceId]/page.tsx`.

**Cómo probarlo:** crea una cuenta con un correo propio y un documento con puntos; reserva y verifica que el formulario muestra el documento sin pedirlo.

## 3. Perfil editable

**Qué cambia:** `/profile` tiene una tarjeta "Editar datos":
- **Nombre:** se guarda al instante y se actualiza en el encabezado.
- **Documento (solo clientes):** editable con la misma regla del registro; no se puede dejar vacío una vez guardado.
- **Correo:** se pide el correo nuevo y la contraseña actual. Se envía un enlace al correo nuevo, firmado, de un solo uso y válido 30 minutos. El cambio solo se aplica al confirmar en `/confirm-email`; mientras tanto se sigue entrando con el correo actual.

**Por qué el correo se confirma:** el acceso con Google/GitHub asocia cuentas por correo. Si se pudiera poner un correo ajeno sin verificarlo, su dueño entraría con Google a una cuenta que no es suya. Por lo mismo, las cuentas de Google/GitHub sin contraseña deben crear una antes de cambiar el correo.

**Archivos:** `src/features/auth/services/email-change.service.ts`, `account.service.ts`, `api/profile.actions.ts`, `components/edit-profile-form.tsx`, `components/confirm-email-form.tsx`, `src/app/(auth)/confirm-email/page.tsx`, `src/app/(account)/profile/page.tsx`.

**Cómo probarlo (escribe en la base compartida; usa una cuenta propia):**
1. Cambia el nombre y verifica el encabezado.
2. Pide el cambio de correo a una dirección tuya, abre el enlace y pulsa "Confirmar nuevo correo".
3. Abre el mismo enlace otra vez: debe decir que ya no es válido.

Sin `RESEND_API_KEY` el correo no sale; el servidor registra el aviso en consola.
