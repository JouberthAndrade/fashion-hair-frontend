import { describe, expect, it } from 'vitest';
import { ADMIN_ROUTES, canAccessRoute, isAdminRoute } from './permissions';

describe('permissions', () => {
  it('identifica rotas administrativas', () => {
    for (const route of ADMIN_ROUTES) {
      expect(isAdminRoute(route)).toBe(true);
    }
    expect(isAdminRoute('/agenda')).toBe(false);
    expect(isAdminRoute('/clientes')).toBe(false);
    expect(isAdminRoute('/perfil')).toBe(false);
  });

  it('permite admin em todas as rotas', () => {
    for (const route of ADMIN_ROUTES) {
      expect(canAccessRoute('ADMIN', route)).toBe(true);
    }
    expect(canAccessRoute('ADMIN', '/agenda')).toBe(true);
  });

  it('bloqueia colaborador em rotas administrativas', () => {
    expect(canAccessRoute('COLLABORATOR', '/painel')).toBe(false);
    expect(canAccessRoute('COLLABORATOR', '/servicos')).toBe(false);
    expect(canAccessRoute('COLLABORATOR', '/colaboradores')).toBe(false);
    expect(canAccessRoute('COLLABORATOR', '/usuarios')).toBe(false);
    expect(canAccessRoute('COLLABORATOR', '/fechamento-caixa')).toBe(false);
  });

  it('permite colaborador nas rotas operacionais', () => {
    expect(canAccessRoute('COLLABORATOR', '/agenda')).toBe(true);
    expect(canAccessRoute('COLLABORATOR', '/clientes')).toBe(true);
    expect(canAccessRoute('COLLABORATOR', '/perfil')).toBe(true);
  });
});
