import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/features/auth/lib/session';
import { getActiveStaffByUser } from '@/features/employees/services/staff.service';

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Femployee');
  if (user.role !== 'empleado') redirect(user.role === 'admin' ? '/admin/metrics' : '/');
  if (!(await getActiveStaffByUser(user.id))) redirect('/login?error=employee-inactive');
  return children;
}
