import { api } from './client';
import type { AuthUser, LoginResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<AuthUser & { collaboratorProfile?: unknown }> {
  const { data } = await api.get('/auth/me');
  return data;
}
