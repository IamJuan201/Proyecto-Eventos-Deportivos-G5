import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

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
