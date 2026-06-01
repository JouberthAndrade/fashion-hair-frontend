import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Plus, Phone } from 'lucide-react';

import { listMyAppointments } from '@/api/appointments';
import { appointmentKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { todayISO, formatDateLong, formatCurrency } from '@/lib/date';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { AppointmentActionsMenu } from './AppointmentActionsMenu';
import type { Appointment } from '@/api/types';

function sortByStartTime(items: Appointment[]) {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function MyAgendaPage() {
  const [date, setDate] = useState(todayISO());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: appointmentKeys.myAgenda(date),
    queryFn: () => listMyAppointments(date),
  });

  const sorted = useMemo(() => (data ? sortByStartTime(data) : []), [data]);

  return (
    <>
      <PageHeader
        title="Minha agenda"
        description={formatDateLong(date)}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="agenda-date" className="sr-only">
                Data
              </Label>
              <Input
                id="agenda-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Novo agendamento
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar a agenda"
          description="Verifique sua conexão e tente novamente."
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="Nenhum agendamento"
          description="Você não tem agendamentos para esta data."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Criar agendamento
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((appt) => {
            const displayPrice = appt.priceAtBooking ?? appt.service?.price;
            return (
            <Card key={appt.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[88px] text-center">
                  <p className="text-2xl font-semibold tabular-nums leading-none">{appt.startTime}</p>
                  <p className="text-xs text-muted-foreground">até {appt.endTime}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{appt.client?.name ?? 'Cliente'}</p>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{appt.service?.name ?? ''}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {appt.client?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {appt.client.phone}
                      </span>
                    ) : null}
                    {displayPrice != null ? (
                      <span>{formatCurrency(displayPrice)}</span>
                    ) : null}
                  </div>
                  {appt.notes ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">{appt.notes}</p>
                  ) : null}
                </div>
                <AppointmentActionsMenu appointment={appt} />
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <CreateAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={date}
      />
    </>
  );
}
