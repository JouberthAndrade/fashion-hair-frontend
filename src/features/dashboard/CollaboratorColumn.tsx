import { Scissors } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SPECIALTY_LABELS, STATUS_LABELS, STATUS_STYLES } from '@/lib/enumLabels';
import type { Appointment, Specialty } from '@/api/types';

interface CollaboratorColumnProps {
  name: string;
  specialties: Specialty[];
  avatarUrl: string | null | undefined;
  appointments: Appointment[];
}

export function CollaboratorColumn({
  name,
  specialties,
  avatarUrl,
  appointments,
}: CollaboratorColumnProps) {
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card shadow-sm">
      <header className="flex items-center gap-3 border-b p-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Scissors className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold leading-tight">{name}</h2>
          <p className="text-xs text-muted-foreground">
            {specialties.length > 0
              ? specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')
              : 'Colaborador'}
          </p>
        </div>
        <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-medium tabular-nums">
          {sorted.length}
        </span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem agendamentos.</p>
        ) : (
          sorted.map((appt) => {
            const styles = STATUS_STYLES[appt.status];
            return (
              <article
                key={appt.id}
                className={cn(
                  'rounded-xl border p-3 ring-2 ring-transparent transition-colors',
                  styles.ring,
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold tabular-nums">{appt.startTime}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {appt.endTime}
                  </span>
                </div>
                <p className="mt-1 truncate font-medium">{appt.client?.name ?? 'Cliente'}</p>
                <p className="truncate text-xs text-muted-foreground">{appt.service?.name ?? ''}</p>
                <span
                  className={cn(
                    'mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                    styles.badge,
                  )}
                >
                  {STATUS_LABELS[appt.status]}
                </span>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
