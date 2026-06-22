import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getServiceRates, updateServiceRates } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CollaboratorServiceRateItem } from '@/api/types';

interface Props {
  collaboratorId: string;
}

export function ServiceRatesEditor({ collaboratorId }: Props) {
  const qc = useQueryClient();

  const { data: rates = [], isLoading } = useQuery({
    queryKey: collaboratorKeys.serviceRates(collaboratorId),
    queryFn: () => getServiceRates(collaboratorId),
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const payload = rates.map((r) => {
        const raw = drafts[r.serviceId];
        const parsed = raw !== undefined ? (raw.trim() === '' ? null : Number(raw)) : r.configuredRate;
        return { serviceId: r.serviceId, ratePercent: parsed };
      });
      return updateServiceRates(collaboratorId, payload);
    },
    onSuccess: () => {
      toast.success('Taxas salvas.');
      setDrafts({});
      qc.invalidateQueries({ queryKey: collaboratorKeys.serviceRates(collaboratorId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar taxas')),
  });

  const effectiveDisplay = (r: CollaboratorServiceRateItem) => {
    const raw = drafts[r.serviceId];
    if (raw !== undefined) {
      const n = Number(raw);
      return raw.trim() === '' ? r.effectiveRate : (isNaN(n) ? r.effectiveRate : n);
    }
    return r.effectiveRate;
  };

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Carregando serviços…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Serviço</th>
              <th className="w-20 px-3 py-2 text-center">Min</th>
              <th className="w-32 px-3 py-2 text-center">Taxa (%)</th>
              <th className="w-24 px-3 py-2 text-center">Efetiva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rates.map((r) => (
              <tr key={r.serviceId}>
                <td className="px-3 py-2 font-medium">{r.serviceName}</td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {r.durationMin}
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="—"
                    value={drafts[r.serviceId] ?? (r.configuredRate !== null ? String(r.configuredRate) : '')}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [r.serviceId]: e.target.value }))
                    }
                    className="h-7 w-full text-center text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {effectiveDisplay(r).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Campo vazio = usa taxa do serviço ou global.
        </p>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || Object.keys(drafts).length === 0}
        >
          {mutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Salvar taxas
        </Button>
      </div>
    </div>
  );
}
