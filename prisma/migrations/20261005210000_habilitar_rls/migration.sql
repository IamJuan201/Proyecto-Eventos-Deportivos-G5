-- Seguridad de las tablas frente a la API pública de Supabase (PostgREST).
-- La aplicación accede solo desde el servidor con Prisma, como propietario de las tablas,
-- por lo que no se ve afectada: RLS no aplica al propietario mientras no se use FORCE.

-- 1. RLS sin políticas: la API pública (roles anon y authenticated) no puede leer ni escribir.
ALTER TABLE "Rol" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Servicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HorarioServicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membresia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CierreServicio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Festivo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Empleado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reserva" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TerminosAceptados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QR" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroAcceso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Sin privilegios para los roles de la API, también en tablas futuras.
--    Se omite fuera de Supabase (por ejemplo, un PostgreSQL local sin esos roles).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
  END IF;
END $$;
