import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2, Users as UsersIcon } from 'lucide-react';

import { deleteClient, listClients } from '@/api/clients';
import { getApiErrorMessage } from '@/api/client';
import { clientKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClientFormDialog } from './ClientFormDialog';
import { confirm } from '@/components/shared/confirm';
import type { Client } from '@/api/types';

export function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: clientKeys.list({ search: debounced, page }),
    queryFn: () => listClients({ search: debounced || undefined, page, limit: 20 }),
  });

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const meta = data?.meta;

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      toast.success('Cliente removido.');
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao remover')),
  });

  const handleEdit = (client: Client) => {
    setEditing(client);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes do salão."
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar"
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-10 w-10" />}
          title="Nenhum cliente"
          description={debounced ? 'Nenhum resultado para a busca.' : 'Cadastre o primeiro cliente.'}
          action={<Button onClick={handleNew}><Plus className="h-4 w-4" /> Novo cliente</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {clients.map((client) => (
                <li key={client.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.phone}
                      {client.email ? ` · ${client.email}` : ''}
                    </p>
                    {client.notes ? (
                      <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">{client.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover"
                      disabled={deleteMut.isPending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Remover cliente?',
                          description: `O cliente "${client.name}" será removido permanentemente.`,
                          confirmLabel: 'Remover',
                          destructive: true,
                        });
                        if (ok) deleteMut.mutate(client.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Página {meta.page} de {meta.totalPages} ({meta.total} clientes)
          </span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
    </>
  );
}
