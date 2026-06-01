import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listServices } from '@/api/services';
import { listClientPrices, upsertClientPrice, deleteClientPrice } from '@/api/clientPrices';
import { getApiErrorMessage } from '@/api/client';
import { clientKeys, serviceKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/date';

interface Props {
  clientId: string;
}

/**
 * Price book do cliente: preço negociado por serviço. Vazio = usa o preço
 * padrão do serviço. A taxa do salão não é editável aqui (segue ADMIN-only).
 */
export function ClientPriceBook({ clientId }: Props) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: serviceKeys.active(),
    queryFn: () => listServices(false),
  });
  const { data: prices = [], isLoading: loadingPrices } = useQuery({
    queryKey: clientKeys.prices(clientId),
    queryFn: () => listClientPrices(clientId),
  });

  const priceByService = new Map(prices.map((p) => [p.serviceId, p]));

  const invalidate = () => qc.invalidateQueries({ queryKey: clientKeys.prices(clientId) });

  const upsertMut = useMutation({
    mutationFn: ({ serviceId, price }: { serviceId: string; price: number }) =>
      upsertClientPrice(clientId, serviceId, price),
    onSuccess: (_d, vars) => {
      toast.success('Preço salvo.');
      setDrafts((d) => {
        const next = { ...d };
        delete next[vars.serviceId];
        return next;
      });
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar preço')),
  });

  const deleteMut = useMutation({
    mutationFn: (serviceId: string) => deleteClientPrice(clientId, serviceId),
    onSuccess: () => {
      toast.success('Preço removido.');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao remover preço')),
  });

  if (loadingServices || loadingPrices) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {services.map((s) => {
        const entry = priceByService.get(s.id);
        const draft = drafts[s.id];
        const value = draft ?? (entry ? String(entry.price) : '');
        const num = Number(value);
        const validForSave = Boolean(value) && !Number.isNaN(num) && num > 0;
        const isSaving = upsertMut.isPending && upsertMut.variables?.serviceId === s.id;
        const isDeleting = deleteMut.isPending && deleteMut.variables === s.id;

        return (
          <li key={s.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                Padrão: {formatCurrency(s.price)}
                {entry ? ' · preço especial definido' : ''}
              </p>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="w-28"
              placeholder={String(Number(s.price))}
              value={value}
              onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!validForSave || isSaving}
              onClick={() => upsertMut.mutate({ serviceId: s.id, price: num })}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remover preço"
              disabled={!entry || isDeleting}
              onClick={() => deleteMut.mutate(s.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
