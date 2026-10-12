import type { ReactNode } from 'react';
import { requireAdmin } from '@/features/auth/lib/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
