import { api } from './client';
import type { Appointment, AppointmentStatus } from './types';

export interface CreateAppointmentPayload {
  collaboratorId: string;
  serviceId: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  notes?: string;
  clientId?: string;
  newClient?: { name: string; phone: string; email?: string };
}

export async function listMyAppointments(date: string): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>('/appointments/my', { params: { date } });
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await api.post<Appointment>('/appointments', payload);
  return data;
}

export async function rescheduleAppointment(
  id: string,
  payload: { scheduledDate?: string; startTime?: string; serviceId?: string; notes?: string },
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}`, payload);
  return data;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
  return data;
}

export async function cancelAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
