import type { UserRole } from '@/api/types';

/** Rotas acessíveis apenas por administradores. */
export const ADMIN_ROUTES = [
  '/painel',
  '/servicos',
  '/colaboradores',
  '/usuarios',
  '/fechamento-caixa',
] as const;

export function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export function canAccessRoute(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  return !isAdminRoute(path);
}
