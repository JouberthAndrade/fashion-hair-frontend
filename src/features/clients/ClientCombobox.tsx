import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { listClients } from '@/api/clients';
import { clientKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Client } from '@/api/types';

interface ClientComboboxProps {
  value?: string;
  onChange: (client: Client | null) => void;
  placeholder?: string;
}

export function ClientCombobox({ value, onChange, placeholder = 'Buscar cliente...' }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: clientKeys.combobox(debounced),
    queryFn: () => listClients({ search: debounced || undefined, limit: 20 }),
    staleTime: 30_000,
  });

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const selected = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">{selected.name} • {selected.phone}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center gap-2 border-b p-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou telefone"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : clients.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onChange(client);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                  client.id === value && 'bg-accent',
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium leading-tight">{client.name}</span>
                  <span className="text-xs text-muted-foreground">{client.phone}</span>
                </span>
                {client.id === value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
