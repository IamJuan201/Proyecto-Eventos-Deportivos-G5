import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getJsonCurrentUser } from '@/features/auth/lib/json-auth';
import { listDemoEmployees } from '@/shared/lib/demo-store';

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const user = await getJsonCurrentUser();
  if (!user) redirect('/login?next=%2Femployee');
  if (user.role !== 'empleado') redirect(user.role === 'admin' ? '/admin/metrics' : '/');
  const employees = await listDemoEmployees();
  if (!employees.some((employee) => employee.email.toLowerCase() === user.email.toLowerCase() && employee.isActive)) redirect('/login?error=employee-inactive');
  return children;
}
