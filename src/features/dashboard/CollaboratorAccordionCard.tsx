import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/shared/Avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import type { Appointment, Specialty } from '@/api/types';

interface CollaboratorAccordionCardProps {
  name: string;
  specialties: Specialty[];
  appointments: Appointment[];
  defaultOpen?: boolean;
}

export function CollaboratorAccordionCard({
  name,
  specialties,
  appointments,
  defaultOpen = false,
}: CollaboratorAccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <Avatar name={name} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium leading-tight">{name}</span>
          <span className="block text-xs text-muted-foreground">
            {specialties.length > 0
              ? specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')
              : 'Colaborador'}
          </span>
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium tabular-nums">
          {sorted.length}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border p-3">
          {sorted.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum agendamento hoje.
            </p>
          ) : (
            sorted.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5"
              >
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">
                  {appt.startTime}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {appt.client?.name ?? 'Cliente'}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {appt.service?.name ?? ''}
                  </span>
                </span>
                <StatusBadge status={appt.status} />
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
