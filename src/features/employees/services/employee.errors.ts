export class EmployeeError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}
export class EmployeeValidationError extends EmployeeError {}
export class EmployeeEmailAlreadyExistsError extends EmployeeError {}
export class EmployeeNotFoundError extends EmployeeError {}
export class EmployeeSupabaseError extends EmployeeError {}
export class EmployeeOperationNotAllowedError extends EmployeeError {}
export class EmployeeConfigurationError extends EmployeeError {}
