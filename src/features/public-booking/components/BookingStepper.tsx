import { cn } from '@/lib/utils';
import type { BookingStep } from '../hooks/usePublicBooking';

const STEP_LABELS: Record<string, string> = {
  service: 'Serviço',
  professional: 'Profissional',
  datetime: 'Data e horário',
  contact: 'Seus dados',
};

type Props = {
  steps: BookingStep[];
  current: BookingStep;
};

export function BookingStepper({ steps, current }: Props) {
  const currentIndex = steps.indexOf(current);

  return (
    <nav aria-label="Progresso do agendamento" className="mb-8">
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = step === current;
          const isDone = currentIndex > index;
          return (
            <li
              key={step}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isDone && !isActive && 'border-primary/30 bg-primary/10 text-primary',
                !isActive && !isDone && 'border-border text-muted-foreground',
              )}
            >
              {index + 1}. {STEP_LABELS[step] ?? step}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
