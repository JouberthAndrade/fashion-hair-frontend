import { api } from './client';
import type { Collaborator, CollaboratorServiceRateItem, Specialty, WorkingHour, DayOfWeek } from './types';

export async function listCollaborators(): Promise<Collaborator[]> {
  const { data } = await api.get<Collaborator[]>('/collaborators');
  return data;
}

export async function getCollaborator(id: string): Promise<Collaborator> {
  const { data } = await api.get<Collaborator>(`/collaborators/${id}`);
  return data;
}

export async function upsertProfile(
  id: string,
  payload: { specialties: Specialty[]; bio?: string; avatarUrl?: string },
): Promise<unknown> {
  const { data } = await api.put(`/collaborators/${id}/profile`, payload);
  return data;
}

export async function getWorkingHours(id: string): Promise<WorkingHour[]> {
  const { data } = await api.get<WorkingHour[]>(`/collaborators/${id}/working-hours`);
  return data;
}

export interface WorkingHourInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export async function upsertWorkingHours(id: string, workingHours: WorkingHourInput[]): Promise<WorkingHour[]> {
  const { data } = await api.put<WorkingHour[]>(`/collaborators/${id}/working-hours`, { workingHours });
  return data;
}

export async function getServiceRates(id: string): Promise<CollaboratorServiceRateItem[]> {
  const { data } = await api.get<CollaboratorServiceRateItem[]>(`/collaborators/${id}/service-rates`);
  return data;
}

export async function updateServiceRates(
  id: string,
  rates: Array<{ serviceId: string; ratePercent: number | null }>,
): Promise<CollaboratorServiceRateItem[]> {
  const { data } = await api.put<CollaboratorServiceRateItem[]>(
    `/collaborators/${id}/service-rates`,
    { rates },
  );
  return data;
}
