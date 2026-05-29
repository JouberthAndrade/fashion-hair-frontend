import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { getWorkingHours, upsertWorkingHours, type WorkingHourInput } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DAY_LABELS, DAYS_ORDER } from '@/lib/enumLabels';
import type { DayOfWeek } from '@/api/types';

interface WorkingHoursEditorProps {
  collaboratorId: string;
}

type RowState = WorkingHourInput;

const DEFAULT_HOURS: Record<DayOfWeek, { startTime: string; endTime: string; isActive: boolean }> = {
  MONDAY: { startTime: '09:00', endTime: '18:00', isActive: true },
  TUESDAY: { startTime: '09:00', endTime: '18:00', isActive: true },
  WEDNESDAY: { startTime: '09:00', endTime: '18:00', isActive: true },
  THURSDAY: { startTime: '09:00', endTime: '18:00', isActive: true },
  FRIDAY: { startTime: '09:00', endTime: '18:00', isActive: true },
  SATURDAY: { startTime: '09:00', endTime: '14:00', isActive: true },
  SUNDAY: { startTime: '09:00', endTime: '14:00', isActive: false },
};

type RowOverrides = Partial<Record<DayOfWeek, Partial<RowState>>>;

export function WorkingHoursEditor({ collaboratorId }: WorkingHoursEditorProps) {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: collaboratorKeys.workingHours(collaboratorId),
    queryFn: () => getWorkingHours(collaboratorId),
  });

  // We track only user edits as overrides on top of the server data. This avoids
  // re-syncing local state in a useEffect (which the React Compiler flags) when
  // the query refetches and produces a fresh `data` reference.
  const [overrides, setOverrides] = useState<RowOverrides>({});

  const rows = useMemo(() => {
    const map: Record<DayOfWeek, RowState> = {} as Record<DayOfWeek, RowState>;
    for (const day of DAYS_ORDER) {
      const existing = data?.find((wh) => wh.dayOfWeek === day);
      const base: RowState = existing
        ? {
            dayOfWeek: day,
            startTime: existing.startTime,
            endTime: existing.endTime,
            isActive: existing.isActive,
          }
        : { dayOfWeek: day, ...DEFAULT_HOURS[day] };
      map[day] = { ...base, ...(overrides[day] ?? {}) };
    }
    return map;
  }, [data, overrides]);

  const setRow = (day: DayOfWeek, patch: Partial<RowState>) => {
    setOverrides((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const mutation = useMutation({
    mutationFn: (payload: WorkingHourInput[]) => upsertWorkingHours(collaboratorId, payload),
    onSuccess: () => {
      toast.success('Horários atualizados.');
      setOverrides({});
      qc.invalidateQueries({ queryKey: collaboratorKeys.workingHours(collaboratorId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar')),
  });

  const handleSave = () => {
    const payload = DAYS_ORDER.map((d) => rows[d]);
    for (const row of payload) {
      if (row.isActive && row.startTime >= row.endTime) {
        toast.error(`${DAY_LABELS[row.dayOfWeek]}: horário final deve ser após o inicial`);
        return;
      }
    }
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {DAYS_ORDER.map((d) => (
          <Skeleton key={d} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Falha ao carregar horários.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Dia</th>
              <th className="px-3 py-2 text-left">Ativo</th>
              <th className="px-3 py-2 text-left">Início</th>
              <th className="px-3 py-2 text-left">Fim</th>
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map((day) => {
              const row = rows[day];
              return (
                <tr key={day} className="border-t">
                  <td className="px-3 py-2 font-medium">{DAY_LABELS[day]}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) => setRow(day, { isActive: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      value={row.startTime}
                      disabled={!row.isActive}
                      onChange={(e) => setRow(day, { startTime: e.target.value })}
                      className="h-9 w-32"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      value={row.endTime}
                      disabled={!row.isActive}
                      onChange={(e) => setRow(day, { endTime: e.target.value })}
                      className="h-9 w-32"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar horários
        </Button>
      </div>
    </div>
  );
}
