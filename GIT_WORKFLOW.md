# Flujo de ramas y Pull Requests

Este repositorio usa `develop` para integrar el trabajo de cada Sprint y `main` para mantener la versión estable. No se debe trabajar directamente sobre estas ramas.

## Para cada HU

1. Actualiza `develop` y crea una rama desde ella:

   ```bash
   git switch develop
   git pull origin develop
   git switch -c feat/HU-<numero>-<descripcion>
   ```

2. Mantén los cambios acotados a la HU. Usa commits pequeños y mensajes descriptivos, por ejemplo `feat: organiza estructura por dominios` o `docs: documenta flujo de migraciones`.
3. Publica la rama y abre un Pull Request hacia `develop`:

   ```bash
   git push -u origin feat/HU-<numero>-<descripcion>
   ```

4. En el Pull Request describe el objetivo, resume los cambios e indica las comprobaciones realizadas. Solicita revisión de otro integrante y resuelve sus observaciones antes de integrar.
5. Al cerrar el Sprint, abre un Pull Request de `develop` hacia `main`. Integra a `main` solo después de la revisión y aprobación del equipo.

## Convenciones

- `feat/`: funcionalidad o HU.
- `fix/`: corrección.
- `docs/`: documentación.
- `refactor/`: cambio interno sin modificar el comportamiento.

Usa nombres cortos que identifiquen el alcance, por ejemplo `feat/HU-12-eventos`.

## Migraciones Prisma

Cada cambio del esquema y su migración deben viajar juntos en la misma rama y Pull Request. Crea migraciones con `npx prisma migrate dev --name descripcion-corta`; aplica migraciones ya versionadas en despliegues con `npx prisma migrate deploy`. No edites migraciones que ya llegaron a `develop` o `main`: crea una migración nueva. Si el esquema cambió en otra rama antes de integrar, actualiza tu rama desde `develop`, resuelve el esquema y genera una migración coherente antes de solicitar aprobación.
