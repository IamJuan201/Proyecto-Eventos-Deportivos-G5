# Migraciones de base de datos

Las migraciones PostgreSQL administradas por Prisma se versionan junto con el schema.prisma.

La migración inicial implementa las entidades del diagrama acordado: roles, usuarios, categorías, servicios, horarios, membresías, cierres, empleados, reservas, términos aceptados, pagos, códigos QR y registros de acceso.

Configura DIRECT_URL en .env.local con la conexión directa de PostgreSQL. Prisma carga .env.local mediante prisma.config.ts; no guardes credenciales en el repositorio.

Para aplicar la migración inicial en desarrollo:

    npx prisma migrate deploy

Para cambios posteriores al esquema, crea una migración versionada con npx prisma migrate dev --name descripcion-corta. El índice parcial que mantiene un solo empleado activo por servicio se define directamente en la migración inicial porque Prisma Schema Language no expresa índices parciales.

La web incluye un almacén JSON compartido de demostración en data/elite-club-demo.json para probar el recorrido mientras se conecta el acceso de dominio a Prisma. No se deben subir datos reales de clientes a ese archivo.

## Seguridad (Supabase)

La migración `habilitar_rls` activa RLS sin políticas en todas las tablas de `public` y quita los privilegios de los roles `anon` y `authenticated`, de modo que la API pública de Supabase no puede leer ni escribir datos. La aplicación accede solo desde el servidor con Prisma, como propietario de las tablas, y no se ve afectada.

Cada tabla nueva debe incluir en su migración `ALTER TABLE "<Tabla>" ENABLE ROW LEVEL SECURITY;`. No uses `FORCE ROW LEVEL SECURITY`: bloquearía también a Prisma.
