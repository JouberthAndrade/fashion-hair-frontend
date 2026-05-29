import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/api/types';
import type { ReactNode } from 'react';

interface RoleGateProps {
  allow: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
