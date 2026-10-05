import { createEmployeeSchema, updateEmployeeStatusSchema } from "@/features/employees/schemas/employee.schema";
import { EmployeeValidationError } from "@/features/employees/services/employee.errors";
import type { EmployeeRepository } from "@/features/employees/services/employee.repository";
import type { CreateEmployeeInput, Employee, EmployeeStatus } from "@/features/employees/types/employee.types";

function parseOrThrow<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  if (!result.success) {
    throw new EmployeeValidationError("Los datos del empleado no son válidos.", { cause: result.error });
  }
  return result.data as T;
}

export function createEmployeeService(repository: EmployeeRepository) {
  return {
    async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
      const employeeInput = parseOrThrow(createEmployeeSchema.safeParse(input));
      const { authUserId } = await repository.createAuthenticationAccount(employeeInput);
      const { userId } = await repository.createUserRecord(employeeInput, authUserId);
      await repository.assignEmployeeRole(userId);
      // TODO: Define compensation/transaction strategy with the final Auth and DB model.
      return repository.createEmployeeRecord(userId, "active");
    },
    async updateEmployeeStatus(employeeId: string, status: EmployeeStatus): Promise<Employee> {
      const input = parseOrThrow(updateEmployeeStatusSchema.safeParse({ employeeId, status }));
      return repository.updateEmployeeStatus(input.employeeId, input.status);
    },
    activateEmployee(employeeId: string): Promise<Employee> {
      return this.updateEmployeeStatus(employeeId, "active");
    },
    deactivateEmployee(employeeId: string): Promise<Employee> {
      return this.updateEmployeeStatus(employeeId, "inactive");
    },
  };
}

export type EmployeeService = ReturnType<typeof createEmployeeService>;
