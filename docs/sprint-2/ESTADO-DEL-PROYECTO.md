# Estado del proyecto · Élite Club (PEDG)

**Corte:** 7/10/2026, noche. Contrastado con el repositorio (`develop` y `Nicolas-test/Sprint-2-integracion`) y con Jira.

**Sprint 2:** del 8/10 al 12/10/2026. El lunes 12/10 es festivo en Colombia, así que en la práctica quedan 2 días hábiles: jueves 8 y viernes 9.

## 1. Veredicto

**El código está listo para arrancar el Sprint 2. Jira y la integración necesitan 4 acciones mañana a primera hora** (sección 2). Ninguna toma más de unos minutos, pero si no se hacen, el equipo empezará sobre una base desactualizada.

| Área | Estado | Comentario |
|---|---|---|
| Código en `develop` | ✅ | `lint`, `typecheck` y `build` en verde. |
| Rama de integración | ✅ | Las 6 HU de Nicolás integradas sin conflictos; regresión completa en verde. |
| Integración a `develop` | ⚠️ | Pendiente de aprobar y fusionar (acción 1). |
| Sprint 1 en Jira | ⚠️ | Sigue activo; terminó el 7/10 a las 06:45 hora de Bogotá. Quedan 3 HU sin terminar (acción 2). |
| Sprint 2 en Jira | ✅ | Creado y con sus 8 HU. Falta iniciarlo (acción 3). |
| Despliegue | ⚠️ | Faltan variables en Vercel y el VPS (PEDG-40) no existe aún. |
| Pagos y correo | ❌ | Wompi y el proveedor de correo están sin empezar; los dos dependen del VPS. Es la ruta crítica del sprint. |

## 2. Qué hacer antes de empezar (mañana 8/10)

1. **Fusionar la integración en `develop`.**
   - Probar `Nicolas-test/Sprint-2-integracion` y abrir un PR hacia `develop`.
   - Hacerlo antes de que el equipo cree sus ramas: así todos parten de la versión con las 6 HU.
   - Lo único que falta probar a mano, porque escribe en la base:
     - reservar con dos navegadores (PEDG-28);
     - iniciar sesión con la contraseña nueva de un empleado (PEDG-31).
2. **Cerrar el Sprint 1.** Jira preguntará qué hacer con las HU que no están terminadas:

   | HU | Estado | Sugerencia |
   |---|---|---|
   | PEDG-15 HU-04 Despliegue continuo (Juan) | En curso | Decidir con Juan. Si solo faltan las variables de Vercel, cerrarla. |
   | PEDG-22 HU-14 Google OAuth (Alfredo) | En curso | Pasar al Sprint 2 o cerrarla si ya funciona. |
   | PEDG-27 HU-20 Catálogo (Jonathan) | En curso | Pasar al Sprint 2 junto a PEDG-41 (misma rama). |

   Las HU en **"En revisión"** (16, 26, 28, 31, 44) Jira las cuenta como terminadas al cerrar el sprint. Si alguna no pasa la revisión, hay que reabrirla.
3. **Iniciar el Sprint 2.**
4. **Ubicar PEDG-37 y PEDG-39.** Están "En revisión" pero sin sprint. Se trabajaron en el Sprint 1; conviene asignarlas a ese sprint antes de cerrarlo para que cuenten en su avance.

## 3. Sprint 2: qué hay que entregar

| HU | Responsable | Estado | Depende de | Puntos |
|---|---|---|---|---|
| PEDG-40 Despliegue en VPS con dominio, HTTPS y webhooks | Zerik | Por hacer | — | 8 |
| PEDG-35 Pago con Wompi, solo en demo/sandbox | Zerik | Por hacer | PEDG-40 (URL del webhook) | — |
| PEDG-29 HU-43 Proveedor de correos | Zerik | Por hacer | PEDG-40 (dominio verificado) | — |
| PEDG-36 QR por correo al confirmar el pago | Zerik | Por hacer | PEDG-29 y PEDG-35 | — |
| PEDG-21 HU-13 Verificación de correo | Alfredo | Por hacer | PEDG-29 | — |
| PEDG-23 HU-15 Recuperación de contraseña | Alfredo | En curso | PEDG-29 | — |
| PEDG-34 HU-12 Registro con correo y contraseña | Alfredo | En curso | — | — |
| PEDG-41 Identidad visual Élite Club | Jonathan | En curso | — | 3 |

Las HU que vienen del Sprint 1 tienen la label `arrastre-prioritario`. Solo las HU nuevas tienen puntos; las demás nunca se estimaron.

**Ruta crítica:**

```
PEDG-40 (VPS) ─┬─> PEDG-35 (Wompi) ──┐
               └─> PEDG-29 (correo) ─┼─> PEDG-36 (QR por correo)
                                     ├─> PEDG-21 (verificación)
                                     └─> PEDG-23 (recuperación)
```

Cinco de las ocho HU dependen del VPS y Zerik carga cuatro de ellas. Si PEDG-40 no sale el jueves 8, el resto del sprint queda en riesgo.

**Plan B ya disponible:** el pago demo funciona y genera los QR. La demo puede hacerse sin Wompi.

## 4. Lo que quedó en revisión (HU de Nicolás)

Cada HU tiene su rama, un documento en `docs/sprint-2/PEDG-XX.md` y un comentario en Jira con cómo probarla.

| HU | Qué cambia | Para el despliegue |
|---|---|---|
| PEDG-39 Expiración de bloqueos | Endpoint `GET /api/cron/expire-reservations`, que se llama cada 5 minutos | Crear `CRON_SECRET` y la línea de crontab en el VPS |
| PEDG-37 Métricas | Día, semana y mes con más ventas | — |
| PEDG-26 HU-19 Franjas | No deja quitar un día de operación que tenga reservas activas | — |
| PEDG-44 Festivos | Los festivos no se pueden reservar; festivos de 2027 ya cargados en la base | — |
| PEDG-28 HU-21 Cupos en vivo | Los cupos se refrescan cada 30 s | — |
| PEDG-31 HU-32 Empleados | Cambio de contraseña; se retiró el módulo viejo de Supabase | — |

## 5. Riesgos y pendientes conocidos

| # | Tema | Dónde | Responsable |
|---|---|---|---|
| 1 | La recuperación de contraseña cambia la clave en Supabase Auth, pero el login usa el hash propio, así que no funciona | PEDG-23 | Alfredo |
| 2 | Quien entra con Google o GitHub usando el correo de un empleado no necesita contraseña | PEDG-22 / PEDG-31 | Alfredo |
| 3 | Cambiar la contraseña de un empleado no cierra sus sesiones abiertas (desactivarlo sí) | PEDG-31 | Migración a Supabase Auth |
| 4 | Faltan `DATABASE_URL`, `SESSION_SECRET` y ahora `CRON_SECRET` en Vercel y en el VPS | PEDG-15 / PEDG-40 | Juan / Zerik |
| 5 | La rama de Jonathan no parte de `develop`: 52 conflictos y todavía usa el JSON de demo | PEDG-41 | Jonathan |
| 6 | Restos de Stripe (`stripe.ts`, `/api/stripe/webhook` y el texto del checkout) | PEDG-35 | Zerik |
| 7 | `/camera-test` se puede abrir sin iniciar sesión | PEDG-30 | isai |
| 8 | El pago aprobado después de vencer el bloqueo no tiene regla acordada con el cliente | PEDG-39 / PEDG-35 | Cliente |
| 9 | No hay framework de pruebas automáticas; todo se valida a mano | — | Equipo |
| 10 | Quedaron sin uso `zod` y `src/shared/lib/supabase/admin.ts` | — | Equipo |
| 11 | Antes de dic-2027 hay que cargar los festivos de 2028 | `prisma/seed/datos.json` | BD |
| 12 | Dos commits viejos de `develop` (`efac63b` y `c3740a6`) tienen la línea `Co-Authored-By` | Historial de git | Decidir; reescribir historial publicado es destructivo |

## 6. Decisiones vigentes

Estas decisiones se toman como verdad mientras nadie las refute:

- **Turnos de 1 hora fija**, de 08:00 a 17:00. Los lunes y los festivos el complejo cierra.
- **Pasarela:** Wompi, y para la entrega basta el entorno de demo (sandbox).
- **"Tiempo real" de los cupos:** refresco cada 30 segundos.
- **Credenciales del empleado:** solo se cambia la contraseña, no el correo.
- **Descripción de categoría:** opcional.
- **Fuente de los festivos:** la tabla `Festivo`.

## 7. Cómo verificar este documento

- **Código:**

  ```bash
  git switch Nicolas-test/Sprint-2-integracion
  npm install
  npm run lint && npm run typecheck && npm run build
  ```

- **Jira:** filtrar el tablero por `sprint = "PEDG Sprint 2"` y por `labels = arrastre-prioritario`.
- **Cuentas demo:** las de la sección "Cuentas demo" del README (admin, cliente y empleado).
