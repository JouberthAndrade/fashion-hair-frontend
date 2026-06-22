import axios from 'axios';
import type { Specialty } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const publicApi = axios.create({
  baseURL: `${BASE_URL}/public`,
  headers: { 'Content-Type': 'application/json' },
});

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  specialty: Specialty | null;
};

export type PublicCollaborator = {
  id: string;
  name: string;
  specialty: Specialty | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type AvailabilityResponse = {
  date: string;
  slots: string[];
};

export type CreatePublicAppointmentPayload = {
  collaboratorId: string;
  serviceId: string;
  scheduledDate: string;
  startTime: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  privacyConsent: true;
  marketingOptIn: boolean;
  website?: string;
};

export type PublicAppointmentResult = {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  service: { id: string; name: string; durationMin: number };
  collaborator: { id: string; name: string };
  client: { name: string; email: string };
};

export type PrivacyPolicyResponse = {
  version: string;
  content: string;
  updatedAt: string;
};

export async function listPublicServices() {
  const { data } = await publicApi.get<PublicService[]>('/services');
  return data;
}

export async function listPublicCollaborators(serviceId: string) {
  const { data } = await publicApi.get<PublicCollaborator[]>('/collaborators', {
    params: { serviceId },
  });
  return data;
}

export async function getPublicAvailability(params: {
  collaboratorId: string;
  serviceId: string;
  date: string;
}) {
  const { data } = await publicApi.get<AvailabilityResponse>('/availability', { params });
  return data;
}

export async function createPublicAppointment(payload: CreatePublicAppointmentPayload) {
  const { data } = await publicApi.post<PublicAppointmentResult>('/appointments', payload);
  return data;
}

export async function getPrivacyPolicy() {
  const { data } = await publicApi.get<PrivacyPolicyResponse>('/privacy-policy');
  return data;
}
