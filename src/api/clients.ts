import { api } from './client';
import type { Client, Pagination } from './types';

export async function listClients(params: { page?: number; limit?: number; search?: string; phone?: string } = {}): Promise<Pagination<Client>> {
  const { data } = await api.get<Pagination<Client>>('/clients', { params });
  return data;
}

export async function getClient(id: string): Promise<Client & { appointments: unknown[] }> {
  const { data } = await api.get(`/clients/${id}`);
  return data;
}

export async function createClient(payload: { name: string; phone: string; email?: string; notes?: string }): Promise<Client> {
  const { data } = await api.post<Client>('/clients', payload);
  return data;
}

export async function updateClient(
  id: string,
  payload: Partial<{ name: string; phone: string; email: string; notes: string }>,
): Promise<Client> {
  const { data } = await api.patch<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
