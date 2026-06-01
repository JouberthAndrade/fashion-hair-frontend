import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getPublicAvailability } from '@/api/publicBooking';
import { getApiErrorMessage } from '@/api/client';
import { publicBookingKeys } from '@/lib/queryKeys';
import { todayISO } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookingSelectionBar } from '../components/BookingSelectionBar';
import { SlotGrid } from '../components/SlotGrid';
import type { PublicCollaborator, PublicService } from '@/api/publicBooking';

type Props = {
  service: PublicService;
  collaborator: PublicCollaborator;
  scheduledDate: string;
  onDateChange: (date: string) => void;
  onTimePick: (time: string) => void;
  onBack: () => void;
  onChangeService: () => void;
};

export function DateTimeStep({
  service,
  collaborator,
  scheduledDate,
  onDateChange,
  onTimePick,
  onBack,
  onChangeService,
}: Props) {
  const date = scheduledDate || todayISO();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: publicBookingKeys.availability(collaborator.id, service.id, date),
    queryFn: () =>
      getPublicAvailability({ collaboratorId: collaborator.id, serviceId: service.id, date }),
    enabled: Boolean(collaborator.id && service.id && date),
  });

  return (
    <div className="space-y-6">
      <BookingSelectionBar service={service} onChangeService={onChangeService} />

      <div>
        <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-2" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Trocar profissional
        </Button>
        <h2 className="text-xl font-semibold">Quando você pode?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Horários de <strong>{collaborator.name}</strong>. Toque em um horário para continuar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-date">Data</Label>
        <Input
          id="booking-date"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {isError ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, 'Erro ao carregar horários')}
          </p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <SlotGrid
          slots={data?.slots ?? []}
          selected=""
          onSelect={onTimePick}
          isLoading={isLoading || isFetching}
        />
      )}
    </div>
  );
}
