-- Ajustes del DER v2 sobre la migración inicial (ver docs/DER.md).
-- El índice parcial Empleado_servicio_id_activo_key se mantiene desde la migración inicial.
-- DropIndex
DROP INDEX "Pago_reserva_id_key";

-- DropIndex
DROP INDEX "Pago_stripe_payment_id_key";

-- AlterTable
ALTER TABLE "Rol" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "auth_id" UUID,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "descripcion" VARCHAR(200),
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Servicio" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HorarioServicio" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Membresia" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "CierreServicio" ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "servicio_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Empleado" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Reserva" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "TerminosAceptados" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Pago" DROP COLUMN "stripe_payment_id",
ADD COLUMN     "pasarela" VARCHAR(30) NOT NULL DEFAULT 'wompi',
ADD COLUMN     "referencia" VARCHAR(64) NOT NULL,
ADD COLUMN     "transaccion_id" VARCHAR(100),
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "medio_pago" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QR" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "RegistroAcceso" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- CreateTable
CREATE TABLE "Festivo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "Festivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Festivo_fecha_key" ON "Festivo"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_auth_id_key" ON "Usuario"("auth_id");

-- CreateIndex
CREATE INDEX "CierreServicio_creado_por_idx" ON "CierreServicio"("creado_por");

-- CreateIndex
CREATE INDEX "Reserva_membresia_id_idx" ON "Reserva"("membresia_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_referencia_key" ON "Pago"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_transaccion_id_key" ON "Pago"("transaccion_id");

-- CreateIndex
CREATE INDEX "Pago_reserva_id_estado_idx" ON "Pago"("reserva_id", "estado");

-- CreateIndex
CREATE INDEX "QR_reserva_id_idx" ON "QR"("reserva_id");

-- CreateIndex
CREATE INDEX "RegistroAcceso_empleado_id_fecha_hora_idx" ON "RegistroAcceso"("empleado_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "RegistroAcceso_qr_id_idx" ON "RegistroAcceso"("qr_id");
