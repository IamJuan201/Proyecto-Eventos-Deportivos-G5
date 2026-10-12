-- Códigos OTP de verificación de correo (HU-13): un código activo por usuario,
-- guardado como hash SHA256, con expiración y espera de reenvío configurables por .env.
-- CreateTable
CREATE TABLE "CodigoOtp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "codigo_hash" VARCHAR(64) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimo_envio_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodigoOtp_usuario_id_key" ON "CodigoOtp"("usuario_id");

-- AddForeignKey
ALTER TABLE "CodigoOtp" ADD CONSTRAINT "CodigoOtp_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: las cuentas creadas antes de la verificación quedan confirmadas,
-- así ningún usuario existente pierde el acceso al activar el bloqueo de login.
UPDATE "Usuario" SET correo_confirmado = true WHERE correo_confirmado = false;
