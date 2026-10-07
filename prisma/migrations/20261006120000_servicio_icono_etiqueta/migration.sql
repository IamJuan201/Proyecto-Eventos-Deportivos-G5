-- Datos de presentación del catálogo que la app ya usaba en el JSON de demo (ver docs/PLAN-MIGRACION-PRISMA.md, D1).
-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "etiqueta" VARCHAR(60),
ADD COLUMN     "icono" VARCHAR(20);
