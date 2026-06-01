import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/date';
import type { PublicService } from '@/api/publicBooking';

type Props = {
  service: PublicService;
  onChangeService: () => void;
};

export function BookingSelectionBar({ service, onChangeService }: Props) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border bg-primary/5 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Serviço</p>
        <p className="truncate font-semibold">{service.name}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {service.durationMin} min · {formatCurrency(service.price)}
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onChangeService}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Trocar
      </Button>
    </div>
  );
}
