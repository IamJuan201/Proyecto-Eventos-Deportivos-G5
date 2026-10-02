# Migraciones de base de datos

Las migraciones PostgreSQL administradas por Prisma pertenecen en esta carpeta. Se versionan junto con el cambio correspondiente en `../schema.prisma`.

El esquema inicial aún no define modelos, así que todavía no hay una migración inicial que generar. Cuando el equipo acuerde los modelos, créala desde la raíz del proyecto con:

```bash
npx prisma migrate dev --name inicial
```

Configura `DIRECT_URL` en `.env.local` con la conexión directa de Supabase para ejecutar migraciones. No guardes credenciales en el repositorio. Para desplegar migraciones ya creadas se usa `npx prisma migrate deploy`.
