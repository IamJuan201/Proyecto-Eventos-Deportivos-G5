# syntax=docker/dockerfile:1

# ---- base: Node + system libraries Prisma's CLI needs on Alpine ----
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- deps: install node_modules once, cached while package*.json don't change ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate the Prisma client and build Next.js ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# .env is mounted only for this command: NEXT_PUBLIC_* values get inlined into the
# browser bundle. Next copies .env files into the standalone output, so they are
# removed in the same step and no secret is written into any image layer.
RUN --mount=type=secret,id=env,target=/app/.env \
    npm run build \
 && rm -f .next/standalone/.env*

# ---- migrate: optional one-off image with the Prisma CLI (migrations and seed) ----
FROM builder AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: the small production image ----
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
