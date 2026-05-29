import { api } from './client';
import type {
  CashClosingHistoryItem,
  CashClosingPeriod,
  CashClosingReport,
  CashClosingSettings,
} from './types';

export async function getCashClosingSettings(): Promise<CashClosingSettings> {
  const { data } = await api.get<CashClosingSettings>('/cash-closing/settings');
  return data;
}

export async function updateCashClosingSettings(body: {
  defaultSalonFeeRatePercent: number;
}): Promise<{ defaultSalonFeeRatePercent: number; updatedAt: string }> {
  const { data } = await api.patch('/cash-closing/settings', body);
  return data;
}

export async function updateServiceFee(
  serviceId: string,
  body: { salonFeeRatePercent: number | null },
) {
  const { data } = await api.patch(`/cash-closing/services/${serviceId}/fee`, body);
  return data;
}

export async function getCashClosingReport(
  period: CashClosingPeriod,
  date: string,
): Promise<CashClosingReport> {
  const { data } = await api.get<CashClosingReport>('/cash-closing/report', {
    params: { period, date },
  });
  return data;
}

export async function closeCash(body: {
  period: CashClosingPeriod;
  date: string;
  notes?: string;
}): Promise<CashClosingReport> {
  const { data } = await api.post<CashClosingReport>('/cash-closing/close', body);
  return data;
}

export async function getCashClosingHistory(limit = 20): Promise<CashClosingHistoryItem[]> {
  const { data } = await api.get<CashClosingHistoryItem[]>('/cash-closing/history', {
    params: { limit },
  });
  return data;
}
