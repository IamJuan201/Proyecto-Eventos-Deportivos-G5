# Flujo de Trabajo en Git (Git Workflow)

Para que podamos trabajar simultáneamente sin conflictos, seguiremos una estrategia basada en **Feature Branches** junto con **Pull Requests (PRs)**.

## 1. Ramas Principales
- `main`: Es la rama de producción. Siempre debe ser estable. **Nadie sube código directamente a main.**
- `dev` (opcional si queremos probar antes de producción) o directamente trabajar todo sobre `main` en proyectos pequeños. Asumiremos que las ramas nacen de `main`.

## 2. Nomenclatura de Ramas
Cada vez que tomes una tarea (un feature, una corrección o algo de documentación), crea una rama nueva desde `main`.

Usa los siguientes prefijos:
- `feat/`: Para nuevas funcionalidades (ej. `feat/login-page`, `feat/registro-usuarios`).
- `fix/`: Para arreglar errores (ej. `fix/error-login`).
- `docs/`: Para cambios de documentación.
- `refactor/`: Para mejorar código sin cambiar su comportamiento.

**Ejemplo:** `git checkout -b feat/login-usuario`

## 3. Flujo de Trabajo Diario

### Paso 1: Actualizar tu rama base
Siempre asegúrate de tener la última versión antes de empezar:
```bash
git checkout main
git pull origin main
```

### Paso 2: Crear tu rama
```bash
git checkout -b feat/nombre-de-tu-tarea
```

### Paso 3: Trabajar y hacer Commits
Realiza commits atómicos (cambios pequeños y lógicos). Escribe los mensajes en imperativo y en español:
- BIEN: `feat: agrega el formulario de login`
- MAL: `agregando login` o `modifique unos archivos`

```bash
git add <archivos>
git commit -m "feat: agrega formulario de login"
```

### Paso 4: Subir tu rama
```bash
git push origin feat/nombre-de-tu-tarea
```

## 4. Pull Requests (PR) y Revisión de Código
1. Ve a GitHub y abre un Pull Request desde tu rama hacia `main`.
2. Asigna a otro miembro del equipo (ej. Juan David) para que lo revise.
3. El revisor dejará comentarios. Si todo está bien, lo aprobará (Approve).
4. Una vez aprobado, el PR se puede mezclar (Merge) a `main`.

> **Regla de oro:** Si hay conflictos al intentar hacer merge, el creador de la rama debe solucionarlos en su computadora haciendo `git pull origin main` en su rama, resolviendo, y volviendo a subir.

## 5. Migraciones de base de datos (Prisma)
- Las migraciones viven en `prisma/migrations` y se suben al repositorio junto con el cambio de `prisma/schema.prisma`.
- Cada cambio del schema se hace en su propia rama y su propio PR: `npx prisma migrate dev --name descripcion-corta`.
- Nunca edites una migracion que ya esta en `main`; crea una nueva.
- Si dos ramas tocan `schema.prisma`, quien haga merge de segundo hace `git pull origin main`, resuelve el conflicto y genera la migracion de nuevo.
