import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getJsonCurrentUser } from '@/features/auth/lib/json-auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getJsonCurrentUser();
  if (!user) redirect('/login?next=%2Fadmin%2Fmetrics');
  if (user.role !== 'admin') redirect(user.role === 'empleado' ? '/employee' : '/');
  return children;
}
