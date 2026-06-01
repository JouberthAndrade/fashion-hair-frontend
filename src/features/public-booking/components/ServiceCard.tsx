import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/date';
import type { PublicService } from '@/api/publicBooking';

type Props = {
  service: PublicService;
  onPick: () => void;
};

export function ServiceCard({ service, onPick }: Props) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'group w-full rounded-xl border bg-card p-4 text-left transition-all',
        'hover:border-primary hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold group-hover:text-primary">{service.name}</h3>
          {service.description ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          ) : null}
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {service.durationMin} min · {formatCurrency(service.price)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </button>
  );
}
