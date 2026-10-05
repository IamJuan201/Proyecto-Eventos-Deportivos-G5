export interface Rol {
  id: string; 
  nombre: string; 
  descripcion: string; 
  activo: boolean; 
}

export interface User {
  id: string; 
  rol_id: string; 
  nombre: string; 
  correo: string; 
  cedula: string; 
  activo: boolean;
  creado_en: Date; 
}

export interface Auth {
  id: string; 
  usuario_id: string; 
  proveedor_auth: "google" | string; 
  contrasena_hash: string | null; 
  correo_confirmado: boolean;
  actualizado_en: Date;
}
