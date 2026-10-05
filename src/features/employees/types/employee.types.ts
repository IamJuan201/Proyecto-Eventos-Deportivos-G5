export const employeeStatuses = ["active", "inactive"] as const;
export type EmployeeStatus = (typeof employeeStatuses)[number];

/** Current, intentionally small input contract for employee creation. */
export interface CreateEmployeeInput {
  email: string;
  name: string;
  phone?: string;
}

export interface Employee {
  id: string;
  userId: string;
  status: EmployeeStatus;
}

export interface UpdateEmployeeStatusInput {
  employeeId: string;
  status: EmployeeStatus;
}
