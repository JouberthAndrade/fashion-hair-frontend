import { useMemo } from 'react';
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const toISO = (d: Date) => format(d, 'yyyy-MM-dd');

interface AgendaDateStripProps {
  value: string; // yyyy-MM-dd
  onChange: (iso: string) => void;
}

export function AgendaDateStrip({ value, onChange }: AgendaDateStripProps) {
  const selected = useMemo(() => parseISO(value), [value]);
  const weekStart = useMemo(() => startOfWeek(selected, { weekStartsOn: 1 }), [selected]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const shiftWeek = (delta: number) => onChange(toISO(addWeeks(selected, delta)));

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => shiftWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium first-letter:uppercase">
          {format(selected, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onChange(toISO(new Date()))}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" aria-label="Próxima semana" onClick={() => shiftWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const today = isToday(day);
          return (
            <button
              key={toISO(day)}
              type="button"
              onClick={() => onChange(toISO(day))}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-center rounded-lg py-2 transition-colors',
                active
                  ? 'bg-gold text-white shadow-gold'
                  : today
                    ? 'text-gold hover:bg-gold-muted'
                    : 'text-foreground hover:bg-secondary',
              )}
            >
              <span
                className={cn(
                  'text-[10px] uppercase',
                  active ? 'text-white/80' : 'text-muted-foreground',
                )}
              >
                {format(day, 'EEEEE', { locale: ptBR })}
              </span>
              <span className="mt-0.5 text-base font-semibold tabular-nums leading-none">
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
