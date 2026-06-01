/**
 * Centralized React Query key factory.
 *
 * Hierarchy: each domain exposes a base `all` tuple, more specific lists/details
 * extend that prefix so calls like `qc.invalidateQueries({ queryKey: clientKeys.all })`
 * reliably invalidate every dependent query for that domain.
 */

import type { UserRole } from '@/api/types';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: { search?: string; page?: number }) =>
    [...clientKeys.lists(), filters] as const,
  combobox: (search: string) => [...clientKeys.all, 'combobox', search] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  prices: (id: string) => [...clientKeys.detail(id), 'prices'] as const,
  priceResolve: (id: string, serviceId: string) =>
    [...clientKeys.detail(id), 'prices', serviceId] as const,
};

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params: { all?: boolean }) => [...serviceKeys.lists(), params] as const,
  active: () => [...serviceKeys.all, 'active'] as const,
};

export const collaboratorKeys = {
  all: ['collaborators'] as const,
  lists: () => [...collaboratorKeys.all, 'list'] as const,
  detail: (id: string) => [...collaboratorKeys.all, 'detail', id] as const,
  workingHours: (id: string) => [...collaboratorKeys.all, id, 'working-hours'] as const,
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: { search?: string; page?: number; role?: UserRole }) =>
    [...userKeys.lists(), filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export const appointmentKeys = {
  all: ['appointments'] as const,
  myAgenda: (date: string) => [...appointmentKeys.all, 'my', date] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  daily: (date: string) => [...dashboardKeys.all, 'daily', date] as const,
};

export const cashClosingKeys = {
  all: ['cash-closing'] as const,
  settings: () => [...cashClosingKeys.all, 'settings'] as const,
  report: (period: string, date: string) =>
    [...cashClosingKeys.all, 'report', period, date] as const,
  history: () => [...cashClosingKeys.all, 'history'] as const,
};

export const publicBookingKeys = {
  all: ['public-booking'] as const,
  services: () => [...publicBookingKeys.all, 'services'] as const,
  collaborators: (serviceId: string) =>
    [...publicBookingKeys.all, 'collaborators', serviceId] as const,
  availability: (collaboratorId: string, serviceId: string, date: string) =>
    [...publicBookingKeys.all, 'availability', collaboratorId, serviceId, date] as const,
  privacyPolicy: () => [...publicBookingKeys.all, 'privacy-policy'] as const,
};
