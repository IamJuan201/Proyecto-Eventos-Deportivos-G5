import type { SupabaseClient } from "@supabase/supabase-js";
import { EmployeeEmailAlreadyExistsError, EmployeeNotFoundError, EmployeeSupabaseError } from "@/features/employees/services/employee.errors";
import type { EmployeeRepository } from "@/features/employees/services/employee.repository";
import type { CreateEmployeeInput, Employee, EmployeeStatus } from "@/features/employees/types/employee.types";

/** Maps this feature to the eventual database schema; no table/column is assumed. */
export interface EmployeeSupabaseSchema {
  users: { table: string; idColumn: string; authUserIdColumn: string; emailColumn: string; nameColumn: string; phoneColumn?: string };
  roles: { table: string; userIdColumn: string; roleColumn: string; employeeRoleValue: string };
  employees: { table: string; idColumn: string; userIdColumn: string; statusColumn: string };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") throw new EmployeeSupabaseError("Supabase devolvió un registro inválido.");
  return value as Record<string, unknown>;
}
function readString(record: Record<string, unknown>, column: string): string {
  const value = record[column];
  if (typeof value !== "string" || value.length === 0) throw new EmployeeSupabaseError(`Supabase no devolvió la columna esperada: ${column}.`);
  return value;
}
function throwForSupabaseError(error: { message: string; code?: string }): never {
  throw new EmployeeSupabaseError(error.message, { cause: error });
}

export function createSupabaseEmployeeRepository(supabase: SupabaseClient, schema: EmployeeSupabaseSchema): EmployeeRepository {
  return {
    async createAuthenticationAccount(input) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: input.email,
        user_metadata: { name: input.name, ...(input.phone ? { phone: input.phone } : {}) },
      });
      if (error) {
        if (error.code === "email_exists" || /already.*registered/i.test(error.message)) {
          throw new EmployeeEmailAlreadyExistsError("Ya existe una cuenta para este email.", { cause: error });
        }
        return throwForSupabaseError(error);
      }
      if (!data.user?.id) throw new EmployeeSupabaseError("Supabase no devolvió el usuario de autenticación creado.");
      return { authUserId: data.user.id };
    },
    async createUserRecord(input: CreateEmployeeInput, authUserId: string) {
      const values: Record<string, unknown> = {
        [schema.users.authUserIdColumn]: authUserId,
        [schema.users.emailColumn]: input.email,
        [schema.users.nameColumn]: input.name,
      };
      if (input.phone !== undefined && schema.users.phoneColumn) values[schema.users.phoneColumn] = input.phone;
      const { data, error } = await supabase.from(schema.users.table).insert(values).select().single();
      if (error) return throwForSupabaseError(error);
      return { userId: readString(asRecord(data), schema.users.idColumn) };
    },
    async assignEmployeeRole(userId: string) {
      const { error } = await supabase.from(schema.roles.table).insert({
        [schema.roles.userIdColumn]: userId,
        [schema.roles.roleColumn]: schema.roles.employeeRoleValue,
      } as never);
      if (error) return throwForSupabaseError(error);
    },
    async createEmployeeRecord(userId: string, status: EmployeeStatus): Promise<Employee> {
      const { data, error } = await supabase.from(schema.employees.table).insert({ [schema.employees.userIdColumn]: userId, [schema.employees.statusColumn]: status } as never).select().single();
      if (error) return throwForSupabaseError(error);
      const record = asRecord(data);
      return { id: readString(record, schema.employees.idColumn), userId: readString(record, schema.employees.userIdColumn), status };
    },
    async updateEmployeeStatus(employeeId: string, status: EmployeeStatus): Promise<Employee> {
      const { data, error } = await supabase.from(schema.employees.table).update({ [schema.employees.statusColumn]: status }).eq(schema.employees.idColumn, employeeId).select().maybeSingle();
      if (error) return throwForSupabaseError(error);
      if (!data) throw new EmployeeNotFoundError("No se encontró el empleado.");
      const record = asRecord(data);
      return { id: readString(record, schema.employees.idColumn), userId: readString(record, schema.employees.userIdColumn), status };
    },
  };
}
