import { api } from './client';
import type { DailyDashboardResponse } from './types';

export async function getDailyDashboard(date: string): Promise<DailyDashboardResponse> {
  const { data } = await api.get<DailyDashboardResponse>('/dashboard/daily', { params: { date } });
  return data;
}
