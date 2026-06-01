import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateLong } from '@/lib/date';
import type { PublicAppointmentResult } from '@/api/publicBooking';

type Props = {
  result: PublicAppointmentResult;
  onNewBooking: () => void;
};

export function ConfirmationStep({ result, onNewBooking }: Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold">Agendamento confirmado!</h2>
        <p className="mt-2 text-muted-foreground">
          Guarde os detalhes abaixo. Entraremos em contato pelo e-mail{' '}
          <strong>{result.client.email}</strong> se necessário.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 text-left text-sm">
        <p className="font-semibold">{result.service.name}</p>
        <p className="mt-1 text-muted-foreground">
          {formatDateLong(result.scheduledDate)} · {result.startTime} – {result.endTime}
        </p>
        <p className="mt-1 text-muted-foreground">Com {result.collaborator.name}</p>
        <p className="mt-3 font-semibold text-primary">{formatCurrency(result.service.price)}</p>
      </div>

      <Button type="button" className="w-full" onClick={onNewBooking}>
        Fazer outro agendamento
      </Button>
    </div>
  );
}
