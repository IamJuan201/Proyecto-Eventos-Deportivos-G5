import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

// One client per server process; globalThis keeps it across hot reloads in development.
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

/**
 * Created on first use, not on import, so `next build` works without DATABASE_URL
 * (Next imports every route while collecting page data).
 */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada.");

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prisma = client;
  return client;
}

/** P2002 = unique value already exists; P2003 = foreign key still referenced. */
export function isPrismaError(error: unknown, code: "P2002" | "P2003" | "P2025"): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** Ids arrive from URLs and forms; PostgreSQL rejects a malformed uuid instead of returning no rows. */
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
