import { api } from './client';
import type { Pagination, User, UserRole } from './types';

export async function listUsers(params: { page?: number; limit?: number; role?: UserRole; search?: string } = {}): Promise<Pagination<User>> {
  const { data } = await api.get<Pagination<User>>('/users', { params });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: { name: string; email: string; password: string; role: UserRole }): Promise<User> {
  const { data } = await api.post<User>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: Partial<{ name: string; email: string; role: UserRole; isActive: boolean }>): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, payload);
  return data;
}

export async function changePassword(id: string, payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/users/${id}/password`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
