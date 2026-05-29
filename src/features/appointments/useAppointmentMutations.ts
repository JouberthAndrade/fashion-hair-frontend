import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
  type CreateAppointmentPayload,
} from '@/api/appointments';
import { getApiErrorMessage } from '@/api/client';
import { appointmentKeys, dashboardKeys } from '@/lib/queryKeys';
import type { AppointmentStatus } from '@/api/types';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: appointmentKeys.all });
  qc.invalidateQueries({ queryKey: dashboardKeys.all });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      toast.success('Agendamento criado.');
      invalidate(qc);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao criar agendamento')),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Status atualizado.');
      invalidate(qc);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao atualizar status')),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { scheduledDate?: string; startTime?: string; serviceId?: string; notes?: string };
    }) => rescheduleAppointment(id, payload),
    onSuccess: () => {
      toast.success('Agendamento atualizado.');
      invalidate(qc);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao reagendar')),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      toast.success('Agendamento cancelado.');
      invalidate(qc);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao cancelar')),
  });
}
