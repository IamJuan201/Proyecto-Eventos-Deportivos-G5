# Inicio del Sprint 2 · Élite Club

**Para:** todo el equipo · **Arranque:** jueves 8/10/2026 · **Cierre:** lunes 12/10/2026

> **El lunes 12/10 es festivo.** En la práctica tenemos **2 días hábiles: jueves 8 y viernes 9**. Todo lo del sprint debe estar en PR el viernes.

Estado tomado de Jira y del repositorio el 8/10 en la madrugada. Si algo cambió después, manda Jira.

---

## 1. Antes de escribir código (todos, primera hora)

1. **Esperar el aviso de Nicolás** de que `develop` ya tiene la integración del Sprint 1 (ver sección 4). Crear las ramas antes de eso obliga a resolver conflictos después.
2. Actualizar y preparar el proyecto:

   ```bash
   git switch develop
   git pull origin develop
   npm install
   npm run lint && npm run typecheck
   ```

   **`npm install` es obligatorio** aunque ya lo hayas corrido. Sin `@prisma/adapter-pg`, la app no arranca y el typecheck falla.
3. **Revisar el `.env`** contra `.env.example`. Hay una variable nueva, `CRON_SECRET`. En local solo hace falta para probar el endpoint del cron.
4. **Crear la rama desde `develop`:** `<Nombre>-feature/<PEDG-XX>/<Descripcion-corta>`.
5. **Al terminar una HU:**
   - abrir un PR hacia `develop`;
   - dejar un documento corto en `docs/sprint-2/PEDG-XX.md` con qué se hizo, cómo probarlo y qué quedó pendiente (ver los de PEDG-26 a PEDG-44 como ejemplo);
   - mover la HU a "En revisión".

**Reglas de la base de datos:** la base de Supabase es compartida.
- No correr `prisma migrate dev`, `db push`, `reset` ni el seed completo contra ella.
- Si una HU necesita cambiar el esquema, hablarlo primero con Alejandra.

---

## 2. Qué trabajamos en el Sprint 2 (12 HU)

### 2.1 Lo nuevo

| HU | Responsable | Qué es | Puntos |
|---|---|---|---|
| **PEDG-40** Despliegue en VPS con dominio, HTTPS y webhooks | Zerik | Servidor propio con dominio y HTTPS, variables de entorno, migraciones con `prisma migrate deploy`, health check, plan de reversa y crontab del job de expiración. Es independiente del despliegue en Vercel (HU-04). | 8 |
| **PEDG-41** Identidad visual Élite Club en autenticación y navegación | Jonathan | Llevar login, registro y recuperación a la paleta azul; header, footer y navegación móvil; quitar los tokens `sport-*` que ya no se usan. | 3 |

### 2.2 Lo que viene del Sprint 1

Las HU con la label **`arrastre-prioritario`** van primero.

| HU | Responsable | Estado | Qué falta |
|---|---|---|---|
| **PEDG-35** Pago con Wompi | Zerik | Por hacer | Checkout y webhook en **sandbox/demo**; no hace falta producción. Quitar los restos de Stripe (`stripe.ts`, `/api/stripe/webhook` y el texto del checkout). |
| **PEDG-29** HU-43 Proveedor de correos | Zerik | Por hacer | `src/shared/lib/email.ts` está vacío; faltan las credenciales en `.env.example`. |
| **PEDG-36** QR por correo | Zerik | Por hacer | Los QR ya se generan al pagar; falta enviarlos por correo. |
| **PEDG-21** HU-13 Verificación de correo | Alfredo | Por hacer | El registro no envía el correo y el login no revisa `correo_confirmado`. |
| **PEDG-23** HU-15 Recuperación de contraseña | Alfredo | En curso | **Bug:** la recuperación cambia la clave en Supabase Auth, pero el login valida el hash propio. Hay que actualizar `contrasena_hash`. |
| **PEDG-34** HU-12 Registro con correo y contraseña | Alfredo | En curso | Falta la regla de fortaleza de la contraseña. |
| PEDG-22 HU-14 Autenticación con Google | Alfredo | En curso | Confirmar qué falta. Ojo: quien entra con Google o GitHub usando un correo ya registrado no necesita la contraseña. |
| PEDG-27 HU-20 Consulta del catálogo | Jonathan | En curso | Va de la mano con PEDG-41 (misma rama). |
| PEDG-26 HU-19 Franjas horarias | Nicolás | En curso | El código ya está en la integración: no deja quitar días con reservas activas. Nicolás confirma si queda algo más. |
| PEDG-28 HU-21 Cupos en tiempo real | Nicolás | Listo | Ya está en la integración: refresco cada 30 s. Solo falta la prueba manual de la sección 5. |

### 2.3 Orden de trabajo (ruta crítica)

```
PEDG-40 VPS ─┬─> PEDG-35 Wompi ───┐
             └─> PEDG-29 Correo ──┼─> PEDG-36 QR por correo
                                  ├─> PEDG-21 Verificación de correo
                                  └─> PEDG-23 Recuperación de contraseña
```

- **Zerik:** el jueves por la mañana, PEDG-40. Es lo que destraba a todos. Mientras se propaga el dominio, se puede avanzar Wompi en local con el sandbox.
- **Alfredo:** mientras llega el proveedor de correo, puede avanzar PEDG-34 (fortaleza de la contraseña) y la parte de PEDG-23 que no depende del correo: guardar el token y actualizar `contrasena_hash`.
- **Jonathan:** PEDG-41 y PEDG-27 no dependen de nadie. Primero hay que rebasar la rama (ver la sección 6).
- **Plan B:** si Wompi no sale, la demo se hace con el pago demo, que ya genera los QR.

---

## 3. Qué se cerró del Sprint 1

Quedaron en "Listo" en Jira: PEDG-15, 16, 31, 37, 39 y 44, además de lo que ya estaba terminado (HU-01 a HU-09, HU-17, HU-18, HU-28, HU-37, HU-38, PEDG-38, 42 y 43).

**Importante:** el código de **PEDG-26, 28, 31, 37, 39 y 44** está en la rama de integración y **todavía no está en `develop`**. Se fusiona después de las pruebas de la sección 5.

---

## 4. La rama de integración

`Nicolas-test/Sprint-2-integracion` = `develop` + las 6 HU anteriores. Sirve como entorno de prueba antes de tocar `develop`.

| HU | Qué cambia para el usuario | Documento |
|---|---|---|
| PEDG-39 Expiración de bloqueos | Un job marca como "expirada" toda reserva que no se pagó en 10 minutos | `docs/sprint-2/PEDG-39.md` |
| PEDG-37 Métricas | El panel muestra el día, la semana y el mes con más ventas | `docs/sprint-2/PEDG-37.md` |
| PEDG-26 HU-19 Franjas | No se puede quitar un día de operación que tenga reservas activas | `docs/sprint-2/PEDG-26.md` |
| PEDG-44 Festivos | Los festivos no se pueden reservar; los de 2027 ya están cargados | `docs/sprint-2/PEDG-44.md` |
| PEDG-28 HU-21 Cupos en vivo | Los cupos se actualizan solos cada 30 s | `docs/sprint-2/PEDG-28.md` |
| PEDG-31 HU-32 Empleados | El admin puede cambiar la contraseña de un empleado; se retiró el módulo viejo de Supabase | `docs/sprint-2/PEDG-31.md` |

Validado el 7/10:
- `lint`, `typecheck` y `build` pasan.
- Navegación por rol (admin, cliente y empleado) correcta.
- Lógica de cada HU probada sin escribir en la base.
- Sin conflictos entre las 6 ramas.

---

## 5. Qué hay que probar a mano

Son pruebas que **escriben en la base compartida**; por eso no se hicieron antes. Con las cuentas demo del README:

| # | Prueba | Pasos | Resultado esperado | Quién |
|---|---|---|---|---|
| 1 | Cupos en vivo (PEDG-28) | Abrir el mismo servicio con dos clientes distintos. Reservar un turno en uno, sin pagar. | En el otro, sin recargar, los cupos bajan en menos de 30 s. Si tenía ese turno elegido y se agotó, la hora queda sin elegir. | Nicolás + 1 |
| 2 | Contraseña de empleado (PEDG-31) | Admin → `/admin/employees` → nueva contraseña → "Cambiar contraseña". Cerrar sesión. | El empleado entra con la nueva y no con la anterior. | Nicolás |
| 3 | Desactivar empleado (PEDG-31) | Admin → "Desactivar" a un empleado con sesión abierta. | El empleado pierde el acceso al escáner en la siguiente acción. | Nicolás |
| 4 | Expiración (PEDG-39) | Reservar sin pagar, esperar 10 minutos y llamar al endpoint con `Authorization: Bearer <CRON_SECRET>`. | Responde `{"expired":1}` y la reserva aparece como "expirada" en "Mis reservas". | Nicolás |
| 5 | Días con reservas (PEDG-26) | Admin → editar "Cancha fútbol 11" → quitar el sábado. | Aparece un error explicando que hay reservas activas. Quitar un día sin reservas sí se guarda. | Nicolás |
| 6 | Regresión general | Registro → login → catálogo → reservar → pago demo → ver el QR → escanearlo como empleado. | El flujo completo funciona igual que antes. | Equipo |

**Si todo pasa:** PR de la integración hacia `develop` y aviso al equipo.
**Si algo falla:** se corrige en la rama de esa HU y se vuelve a fusionar en la integración.

---

## 6. Cambios manuales y configuración pendiente

| # | Qué | Dónde | Quién |
|---|---|---|---|
| 1 | Fusionar la integración en `develop` cuando pasen las pruebas | GitHub | Nicolás |
| 2 | Iniciar el Sprint 2 en el tablero | Jira | Nicolás |
| 3 | Cambiar la label `Sprint-1` por `Sprint-2` en PEDG-22, 26, 27 y 28, que pasaron al cerrar el Sprint 1 | Jira | Nicolás |
| 4 | Decidir si PEDG-28, ya "Listo", sale del Sprint 2 | Jira | Nicolás |
| 5 | `DATABASE_URL`, `SESSION_SECRET` y `CRON_SECRET` en las variables de Vercel | Vercel | Juan |
| 6 | Las mismas variables en el VPS, más la línea de crontab del job de expiración (está en `docs/sprint-2/PEDG-39.md`) | VPS | Zerik |
| 7 | Claves de sandbox de Wompi y credenciales del proveedor de correo; documentarlas en `.env.example` sin valores reales | `.env` / `.env.example` | Zerik |
| 8 | Rebasar o portar la rama `jonathan-feature/HU-20/...` sobre `develop`. Hoy tiene 52 conflictos y todavía usa el JSON de demo, que ya no existe. | Git | Jonathan |
| 9 | Retirar o proteger `/camera-test`, que hoy se abre sin sesión | Código | isai |

---

## 7. Reglas del negocio vigentes

- **Turnos de 1 hora**, de 08:00 a 17:00.
- **Días cerrados:** los lunes y los festivos (tabla `Festivo`).
- **Reservas:** de hoy a 15 días. El cupo queda bloqueado **10 minutos** para pagar.
- **Pago:** Wompi, y para la entrega basta el sandbox.
- **Contraseñas:** los empleados solo cambian la contraseña, no el correo.
- **Pago después de vencer el bloqueo:** sin regla acordada con el cliente. Por ahora se rechaza.
- **Pruebas:** no hay framework de pruebas automáticas; cada HU se valida a mano y lo documenta.
