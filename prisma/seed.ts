import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Loads prisma/seed/datos.json (DER column names) into PostgreSQL.
 * Idempotent: every row is upserted by its fixed UUID inside a single transaction.
 */

type Row = Record<string, unknown> & { id: string };

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Define DIRECT_URL o DATABASE_URL en .env.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// date, time and timestamptz columns of the DER (fecha*, hora*, *_en, ultima_actividad).
const DATE_COLUMN = /^(fecha|hora)|_en$|^ultima_actividad$/;
const TIME = /^\d{2}:\d{2}:\d{2}$/;

/** snake_case column → camelCase Prisma field, and ISO strings → Date. */
function toPrismaData(row: Row) {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => {
      const field = column.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      if (typeof value !== "string" || !DATE_COLUMN.test(column)) return [field, value];
      return [field, new Date(TIME.test(value) ? `1970-01-01T${value}Z` : value)];
    }),
  );
}

type Delegate = { upsert(args: { where: { id: string }; create: object; update: object }): Promise<unknown> };

async function main() {
  const data: Record<string, Row[]> = JSON.parse(await readFile("prisma/seed/datos.json", "utf-8"));

  await prisma.$transaction(
    async (tx) => {
      // Dependency order: every foreign key points to a row loaded earlier.
      const tables = [
        ["Rol", "rol"],
        ["Usuario", "usuario"],
        ["Categoria", "categoria"],
        ["Servicio", "servicio"],
        ["HorarioServicio", "horarioServicio"],
        ["Empleado", "empleado"],
        ["Membresia", "membresia"],
        ["Reserva", "reserva"],
        ["Pago", "pago"],
        ["QR", "codigoQR"],
        ["RegistroAcceso", "registroAcceso"],
        ["CierreServicio", "cierreServicio"],
        ["TerminosAceptados", "terminosAceptados"],
        ["Festivo", "festivo"],
      ] as const;

      for (const [table, model] of tables) {
        // Each model has its own generic upsert signature; the JSON already matches the DER columns.
        const delegate = tx[model] as unknown as Delegate;
        for (const row of data[table] ?? []) {
          const values = toPrismaData(row);
          await delegate.upsert({ where: { id: row.id }, create: values, update: values });
        }
      }
    },
    { timeout: 120_000 },
  );

  const counts = {
    Rol: await prisma.rol.count(),
    Usuario: await prisma.usuario.count(),
    Categoria: await prisma.categoria.count(),
    Servicio: await prisma.servicio.count(),
    HorarioServicio: await prisma.horarioServicio.count(),
    Empleado: await prisma.empleado.count(),
    Membresia: await prisma.membresia.count(),
    Reserva: await prisma.reserva.count(),
    Pago: await prisma.pago.count(),
    QR: await prisma.codigoQR.count(),
    RegistroAcceso: await prisma.registroAcceso.count(),
    CierreServicio: await prisma.cierreServicio.count(),
    TerminosAceptados: await prisma.terminosAceptados.count(),
    Festivo: await prisma.festivo.count(),
  };
  console.table(
    Object.entries(counts).map(([table, rows]) => ({ table, mock: data[table]?.length ?? 0, db: rows })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
