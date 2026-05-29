import { useState } from 'react';
import { MoreHorizontal, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCancelAppointment,
  useUpdateAppointmentStatus,
} from './useAppointmentMutations';
import { getStatusTransitions } from './statusTransitions';
import { confirm } from '@/components/shared/confirm';
import { STATUS_LABELS } from '@/lib/enumLabels';
import type { Appointment } from '@/api/types';

interface Props {
  appointment: Appointment;
}

export function AppointmentActionsMenu({ appointment }: Props) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateAppointmentStatus();
  const cancelAppt = useCancelAppointment();
  const transitions = getStatusTransitions(appointment.status);
  const isPending = updateStatus.isPending || cancelAppt.isPending;

  if (transitions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending} aria-label="Ações">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {transitions
          .filter((s) => s !== 'CANCELLED')
          .map((status) => (
            <DropdownMenuItem
              key={status}
              onSelect={() =>
                updateStatus.mutate(
                  { id: appointment.id, status },
                  { onSettled: () => setOpen(false) },
                )
              }
            >
              {STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
        {transitions.includes('CANCELLED') ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={async () => {
                setOpen(false);
                const ok = await confirm({
                  title: 'Cancelar agendamento?',
                  description: 'Esta ação não pode ser desfeita.',
                  confirmLabel: 'Sim, cancelar',
                  cancelLabel: 'Voltar',
                  destructive: true,
                });
                if (ok) cancelAppt.mutate(appointment.id);
              }}
            >
              Cancelar agendamento
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
