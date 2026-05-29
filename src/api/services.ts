import { api } from './client';
import type { Service } from './types';

export async function listServices(includeInactive = false): Promise<Service[]> {
  const { data } = await api.get<Service[]>('/services', {
    params: includeInactive ? { all: 'true' } : undefined,
  });
  return data;
}

export async function createService(payload: {
  name: string;
  durationMin: number;
  price: number;
  description?: string;
}): Promise<Service> {
  const { data } = await api.post<Service>('/services', payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<{ name: string; durationMin: number; price: number; description: string; isActive: boolean }>,
): Promise<Service> {
  const { data } = await api.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
