import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/features/auth/lib/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fadmin%2Fmetrics');
  if (user.role !== 'admin') redirect(user.role === 'empleado' ? '/employee' : '/');
  return children;
}
