import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/features/auth/lib/session';

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fmy-reservations');
  if (user.role !== 'cliente') redirect(user.role === 'admin' ? '/admin/metrics' : '/employee');
  return children;
}
