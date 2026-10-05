import { createSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { EmployeeConfigurationError } from "@/features/employees/services/employee.errors";
import { createEmployeeService } from "@/features/employees/services/employee.service";
import { createSupabaseEmployeeRepository, type EmployeeSupabaseSchema } from "@/features/employees/services/supabase-employee.repository";

/** Composition point for future protected Route Handlers. */
export function getEmployeeService(schema?: EmployeeSupabaseSchema) {
  if (!schema) {
    throw new EmployeeConfigurationError("La integración de empleados requiere el mapeo confirmado de tablas y columnas de Supabase.");
  }
  return createEmployeeService(createSupabaseEmployeeRepository(createSupabaseAdminClient(), schema));
}

// TODO: Integrate with centralized role/permission check once available.
