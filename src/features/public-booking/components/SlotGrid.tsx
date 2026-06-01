import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  slots: string[];
  selected: string;
  onSelect: (slot: string) => void;
  isLoading?: boolean;
};

export function SlotGrid({ slots, selected, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sem horários neste dia. Tente outra data.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="Horários disponíveis">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          role="option"
          aria-selected={selected === slot}
          onClick={() => onSelect(slot)}
          className={cn(
            'rounded-lg border px-2 py-2 text-sm font-medium transition-colors hover:border-primary/50',
            selected === slot && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
