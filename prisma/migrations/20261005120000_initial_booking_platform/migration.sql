-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('pendiente_pago', 'pagada', 'expirada');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('pendiente', 'aprobado', 'fallido');

-- CreateEnum
CREATE TYPE "tipo_cobro" AS ENUM ('por_persona', 'por_hora');

-- CreateEnum
CREATE TYPE "tipo_qr" AS ENUM ('individual', 'grupal');

-- CreateEnum
CREATE TYPE "tipo_cierre" AS ENUM ('mantenimiento', 'festivo', 'evento_privado');

-- CreateEnum
CREATE TYPE "resultado_acceso" AS ENUM ('permitido', 'rechazado_menor', 'qr_invalido', 'reserva_no_pagada', 'servicio_incorrecto', 'fuera_de_horario', 'qr_usado');

-- CreateTable
CREATE TABLE "Rol" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "descripcion" VARCHAR(240),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    "contrasena_hash" VARCHAR(255),
    "proveedor_auth" VARCHAR(40) NOT NULL DEFAULT 'email',
    "correo_confirmado" BOOLEAN NOT NULL DEFAULT false,
    "cedula" VARCHAR(30),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "tipo_cobro" "tipo_cobro" NOT NULL,
    "capacidad_por_hora" INTEGER NOT NULL,
    "capacidad_personas" INTEGER NOT NULL DEFAULT 20,
    "tipo_qr" "tipo_qr" NOT NULL,
    "imagen_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioServicio" (
    "id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HorarioServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membresia" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreServicio" (
    "id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
    "motivo" VARCHAR(240) NOT NULL,
    "tipo" "tipo_cierre" NOT NULL,
    "creado_por" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CierreServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_actividad" TIMESTAMPTZ(6),
    "eliminado_en" TIMESTAMPTZ(6),

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "membresia_id" UUID,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "cantidad_horas" INTEGER NOT NULL,
    "cantidad_cupos" INTEGER NOT NULL,
    "cantidad_personas" INTEGER NOT NULL DEFAULT 1,
    "contiene_menores" BOOLEAN NOT NULL DEFAULT false,
    "adulto_responsable" VARCHAR(120),
    "estado" "estado_reserva" NOT NULL DEFAULT 'pendiente_pago',
    "bloqueo_expira_en" TIMESTAMPTZ(6),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerminosAceptados" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "version_terminos" VARCHAR(30) NOT NULL,
    "aceptado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerminosAceptados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "stripe_payment_id" VARCHAR(255),
    "monto" DECIMAL(12,2) NOT NULL,
    "medio_pago" VARCHAR(40) NOT NULL,
    "estado" "estado_pago" NOT NULL DEFAULT 'pendiente',
    "fecha_pago" TIMESTAMPTZ(6),
    "nombre_comprobante" VARCHAR(120) NOT NULL,
    "cedula_comprobante" VARCHAR(30) NOT NULL,
    "correo_comprobante" VARCHAR(254) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QR" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "codigo" VARCHAR(255) NOT NULL,
    "tipo" "tipo_qr" NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_uso" TIMESTAMPTZ(6),

    CONSTRAINT "QR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAcceso" (
    "id" UUID NOT NULL,
    "qr_id" UUID,
    "empleado_id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "resultado" "resultado_acceso" NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_leido" VARCHAR(255),

    CONSTRAINT "RegistroAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");

-- CreateIndex
CREATE INDEX "Usuario_rol_id_activo_idx" ON "Usuario"("rol_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE INDEX "Servicio_categoria_id_activo_idx" ON "Servicio"("categoria_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioServicio_servicio_id_dia_semana_hora_inicio_key" ON "HorarioServicio"("servicio_id", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE INDEX "Membresia_cliente_id_activa_fecha_inicio_fecha_fin_idx" ON "Membresia"("cliente_id", "activa", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "CierreServicio_servicio_id_activo_fecha_inicio_fecha_fin_idx" ON "CierreServicio"("servicio_id", "activo", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuario_id_key" ON "Empleado"("usuario_id");

-- CreateIndex
CREATE INDEX "Empleado_servicio_id_activo_eliminado_en_idx" ON "Empleado"("servicio_id", "activo", "eliminado_en");

-- CreateIndex
CREATE INDEX "Reserva_servicio_id_fecha_hora_inicio_hora_fin_estado_idx" ON "Reserva"("servicio_id", "fecha", "hora_inicio", "hora_fin", "estado");

-- CreateIndex
CREATE INDEX "Reserva_cliente_id_fecha_estado_idx" ON "Reserva"("cliente_id", "fecha", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "TerminosAceptados_reserva_id_key" ON "TerminosAceptados"("reserva_id");

-- CreateIndex
CREATE INDEX "TerminosAceptados_cliente_id_aceptado_en_idx" ON "TerminosAceptados"("cliente_id", "aceptado_en");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_reserva_id_key" ON "Pago"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_stripe_payment_id_key" ON "Pago"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "Pago_estado_fecha_pago_idx" ON "Pago"("estado", "fecha_pago");

-- CreateIndex
CREATE UNIQUE INDEX "QR_codigo_key" ON "QR"("codigo");

-- CreateIndex
CREATE INDEX "RegistroAcceso_servicio_id_fecha_hora_resultado_idx" ON "RegistroAcceso"("servicio_id", "fecha_hora", "resultado");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioServicio" ADD CONSTRAINT "HorarioServicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreServicio" ADD CONSTRAINT "CierreServicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreServicio" ADD CONSTRAINT "CierreServicio_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_membresia_id_fkey" FOREIGN KEY ("membresia_id") REFERENCES "Membresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminosAceptados" ADD CONSTRAINT "TerminosAceptados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminosAceptados" ADD CONSTRAINT "TerminosAceptados_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "QR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Un servicio solo puede tener un empleado activo y no eliminado.
CREATE UNIQUE INDEX "Empleado_servicio_id_activo_key"
ON "Empleado"("servicio_id")
WHERE "activo" = true AND "eliminado_en" IS NULL;
