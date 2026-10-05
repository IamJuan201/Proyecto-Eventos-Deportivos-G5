import type { CreateEmployeeInput, Employee, EmployeeStatus } from "@/features/employees/types/employee.types";

/** Persistence boundary: keeps business flow independent from table names. */
export interface EmployeeRepository {
  createAuthenticationAccount(input: CreateEmployeeInput): Promise<{ authUserId: string }>;
  createUserRecord(input: CreateEmployeeInput, authUserId: string): Promise<{ userId: string }>;
  assignEmployeeRole(userId: string): Promise<void>;
  createEmployeeRecord(userId: string, status: EmployeeStatus): Promise<Employee>;
  updateEmployeeStatus(employeeId: string, status: EmployeeStatus): Promise<Employee>;
}
