import { z } from "zod";
import { employeeStatuses } from "@/features/employees/types/employee.types";

export const createEmployeeSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  // TODO: Replace with the agreed phone format when that business rule exists.
  phone: z.string().trim().min(1, "El teléfono no puede estar vacío.").optional(),
});

export const employeeStatusSchema = z.enum(employeeStatuses);
export const updateEmployeeStatusSchema = z.object({
  employeeId: z.string().trim().min(1, "El identificador del empleado es obligatorio."),
  status: employeeStatusSchema,
});
