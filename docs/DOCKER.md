# Docker — Élite Club (Eventos Deportivos G5)

Guía para correr la aplicación en un contenedor Docker en cualquier ordenador (Windows, macOS o Linux) sin instalar Node.js. Explica cómo se dockerizó el proyecto, archivo por archivo, y los comandos del día a día.

> **Docker sirve para producción y demos.** La imagen corre `next build` + servidor de producción: no tiene recarga en caliente. Para programar sigue usando `npm run dev` (ver [README](../README.md)).

---

## 1. Cómo funciona en este proyecto

- La app es **Next.js 16** con **Prisma 7** y la base de datos está en **Supabase** (PostgreSQL en la nube). Por eso **no hay contenedor de base de datos**: el contenedor se conecta a Supabase con las URLs del `.env`.
- Hay **un solo contenedor** (`app`) que sirve la web en el puerto `3000`.
- Opcionalmente hay un contenedor de herramientas (`migrate`) para aplicar migraciones o el seed con la CLI de Prisma.

```
 Tu navegador ──► localhost:3000 ──► contenedor "app" (Node + Next standalone) ──► Supabase (DB, Storage)
```

---

## 2. Archivos que se crearon

| Archivo | Para qué sirve |
| --- | --- |
| [`Dockerfile`](../Dockerfile) | Receta para construir la imagen (en varias etapas). |
| [`.dockerignore`](../.dockerignore) | Lo que **no** se copia a la imagen (node_modules, .next, .env, .git…). |
| [`docker-compose.yml`](../docker-compose.yml) | Define los servicios, puertos y variables para no escribir comandos largos. |
| [`next.config.ts`](../next.config.ts) | Se añadió `output: "standalone"`. |

### Paso 1 — `output: "standalone"` en `next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  // ...
};
```

Con esto `next build` genera la carpeta `.next/standalone`: un `server.js` mínimo con **solo** los `node_modules` que la app realmente usa. La imagen final pasa de ~1 GB a ~330 MB y arranca con `node server.js`.

### Paso 2 — `.dockerignore`

Funciona como `.gitignore`, pero para Docker. Evita copiar:

- `node_modules`, `.next`, `src/generated/prisma` → se regeneran dentro de la imagen (los de Windows no sirven en Linux).
- `.env*` → **los secretos nunca se copian a la imagen**.
- `.git`, `docs`, `*.md` → no hacen falta para compilar.

### Paso 3 — `Dockerfile` (multi-etapa)

Cada `FROM ... AS nombre` es una etapa. Solo la última (`runner`) es la imagen que se ejecuta; las demás son intermedias.

| Etapa | Qué hace |
| --- | --- |
| `base` | Parte de `node:24-alpine` (Linux pequeño) e instala `openssl` y `libc6-compat`, que necesita la CLI de Prisma. |
| `deps` | Copia `package.json` + `package-lock.json` y ejecuta `npm ci`. Docker la cachea: si no cambian las dependencias, no se reinstala nada. |
| `builder` | Copia el código y ejecuta `npm run build` (`prisma generate` + `next build`). |
| `migrate` | Igual que `builder`, pero su comando es `prisma migrate deploy`. Solo se usa a demanda. |
| `runner` | Imagen final: copia `.next/standalone`, `.next/static` y `public`, crea un usuario sin privilegios (`nextjs`) y arranca `node server.js` en el puerto 3000. |

**Detalle importante sobre el `.env` en el build.** Las variables `NEXT_PUBLIC_*` (Supabase, Turnstile) se **incrustan en el JavaScript del navegador durante `next build`**, así que el build necesita el `.env`. Para no meter secretos en la imagen:

```dockerfile
RUN --mount=type=secret,id=env,target=/app/.env \
    npm run build \
 && rm -f .next/standalone/.env*
```

- `--mount=type=secret` monta el `.env` **solo durante ese comando**; no queda guardado en ninguna capa.
- Next copia los `.env` dentro de `.next/standalone`; el `rm -f` los borra en el mismo paso.
- Las variables privadas (`DATABASE_URL`, `SESSION_SECRET`, Wompi, Resend…) llegan al contenedor **al arrancar**, vía `env_file: .env` en el compose.

### Paso 4 — `docker-compose.yml`

```yaml
services:
  app:            # la web
    build: { context: ., target: runner, secrets: [env] }
    env_file: .env
    ports: ["3000:3000"]
  migrate:        # herramientas, solo con --profile tools
    build: { context: ., target: migrate, secrets: [env] }
    env_file: .env
    profiles: ["tools"]
secrets:
  env:
    file: .env
```

- `secrets.env` → le pasa el `.env` al build como secreto (Paso 3).
- `env_file: .env` → variables en tiempo de ejecución.
- `ports: "3000:3000"` → puerto de tu PC : puerto del contenedor.
- `profiles: ["tools"]` → `migrate` no arranca con `docker compose up`; solo cuando lo pides.

---

## 3. Correrlo en cualquier ordenador (paso a paso)

### 3.1 Instalar Docker (una sola vez)

| Sistema | Qué instalar |
| --- | --- |
| **Windows 10/11** | [Docker Desktop](https://www.docker.com/products/docker-desktop/). Durante la instalación deja marcado **WSL 2**. Reinicia si lo pide. |
| **macOS** (Intel o Apple Silicon) | [Docker Desktop](https://www.docker.com/products/docker-desktop/) para tu chip. |
| **Linux** | Docker Engine + plugin Compose: `curl -fsSL https://get.docker.com \| sh` y luego `sudo usermod -aG docker $USER` (cierra sesión y vuelve a entrar). |

Comprueba que funciona (en Windows/macOS abre antes Docker Desktop y espera a que diga *Engine running*):

```bash
docker --version
docker compose version
```

No hace falta instalar Node.js ni npm.

### 3.2 Clonar el repositorio

```bash
git clone https://github.com/IamJuan201/Proyecto-Eventos-Deportivos-G5.git
cd Proyecto-Eventos-Deportivos-G5
git checkout develop      # o la rama que vayas a probar
```

### 3.3 Crear el `.env`

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Rellena los valores reales (el tech lead los comparte por un canal privado; **nunca se suben a Git**). Mínimo obligatorio:

- `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

> Si tenías variables en `.env.local`, **muévelas a `.env`**: Docker solo lee `.env`.

### 3.4 Construir y arrancar

```bash
docker compose up -d --build
```

- La **primera vez** tarda unos minutos (descarga Node e instala dependencias). Las siguientes son mucho más rápidas gracias a la caché.
- `-d` lo deja corriendo en segundo plano.

Abre <http://localhost:3000>.

### 3.5 Comandos del día a día

| Quiero… | Comando |
| --- | --- |
| Arrancar (sin recompilar) | `docker compose up -d` |
| Ver los logs en vivo | `docker compose logs -f app` |
| Ver si está corriendo | `docker compose ps` |
| Parar | `docker compose stop` |
| Parar y borrar el contenedor | `docker compose down` |
| Reiniciar tras cambiar una variable privada del `.env` | `docker compose up -d --force-recreate` |
| Actualizar tras `git pull` o tras cambiar una `NEXT_PUBLIC_*` | `docker compose up -d --build` |
| Entrar a una terminal del contenedor | `docker compose exec app sh` |

> **Regla rápida:** si cambias código o una variable `NEXT_PUBLIC_*` → `--build`. Si cambias solo una variable privada → basta `--force-recreate`.

### 3.6 Migraciones y seed (solo si usas una base de datos propia)

La base compartida de Supabase ya tiene las migraciones y el seed aplicados. Si apuntas a una base nueva:

```bash
# Aplicar migraciones
docker compose --profile tools run --rm migrate

# Ver el estado de las migraciones
docker compose --profile tools run --rm migrate npx prisma migrate status

# Cargar los datos demo
docker compose --profile tools run --rm migrate npx prisma db seed
```

`--rm` borra el contenedor de herramientas al terminar.

---

## 4. Compartir la imagen sin compilar (opcional)

Si otro ordenador no puede compilar (poca RAM, sin internet estable), puedes pasarle la imagen ya hecha:

```bash
# En tu PC
docker save eventos-deportivos-g5:latest -o eventos-g5.tar

# En el otro PC (necesita el .env)
docker load -i eventos-g5.tar
docker run -d --name eventos-deportivos-g5 --env-file .env -p 3000:3000 eventos-deportivos-g5:latest
```

> La imagen lleva incrustados los valores `NEXT_PUBLIC_*` con los que se compiló (son públicos, no secretos). Si el otro equipo usa otro proyecto de Supabase, debe compilar su propia imagen.
>
> En Mac Apple Silicon vs. PC Intel/AMD la arquitectura cambia; para generar una imagen para PC desde un Mac: `docker build --platform linux/amd64 --secret id=env,src=.env -t eventos-deportivos-g5 .`

---

## 5. Problemas frecuentes

| Síntoma | Solución |
| --- | --- |
| `failed to connect to the docker API` / `Cannot connect to the Docker daemon` | Docker Desktop no está abierto. Ábrelo y espera a *Engine running*. En Linux: `sudo systemctl start docker`. |
| `secret env: ... no such file` o `env file .env not found` | Falta el `.env` en la raíz del proyecto (Paso 3.3). |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Ya tienes algo en el 3000 (por ejemplo `npm run dev`). Páralo, o cambia el compose a `"3001:3000"` y abre <http://localhost:3001>. |
| `Configura NEXT_PUBLIC_SUPABASE_URL y ...` | Faltan esas variables al compilar. Añádelas al `.env` y ejecuta `docker compose up -d --build`. |
| `DATABASE_URL no está configurada` o errores de conexión a la DB | Revisa `DATABASE_URL` en `.env` y luego `docker compose up -d --force-recreate`. |
| Los cambios de código no se ven | La imagen no se recompila sola: `docker compose up -d --build`. |
| Login/Server Actions fallan al abrir desde otra IP o dominio | Añade ese origen a `ALLOWED_ACTION_ORIGINS` en `.env` (separado por comas) y recompila con `--build`. |
| El pago Wompi no vuelve a la app | `APP_URL` debe ser la URL pública https desde la que se abre la app. |
| Me quedé sin espacio en disco | `docker system prune` borra contenedores parados, imágenes sin usar y caché de builds. |

---

## 6. Resumen en 4 comandos

```bash
git clone https://github.com/IamJuan201/Proyecto-Eventos-Deportivos-G5.git
cd Proyecto-Eventos-Deportivos-G5
cp .env.example .env        # y rellenar valores reales
docker compose up -d --build
# → http://localhost:3000
```
