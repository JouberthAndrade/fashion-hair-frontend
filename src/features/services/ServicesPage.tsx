import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Power, Scissors, Trash2 } from 'lucide-react';

import { deleteService, listServices, updateService } from '@/api/services';
import { getApiErrorMessage } from '@/api/client';
import { serviceKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { RoleGate } from '@/components/shared/RoleGate';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/date';
import { ServiceFormDialog } from './ServiceFormDialog';
import { confirm } from '@/components/shared/confirm';
import type { Service } from '@/api/types';

export function ServicesPage() {
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: serviceKeys.list({ all: showInactive }),
    queryFn: () => listServices(showInactive),
  });

  const services = data ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateService(id, { isActive }),
    onSuccess: () => {
      toast.success('Serviço atualizado.');
      qc.invalidateQueries({ queryKey: serviceKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao atualizar')),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success('Serviço desativado.');
      qc.invalidateQueries({ queryKey: serviceKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao remover')),
  });

  const handleEdit = (service: Service) => {
    setEditing(service);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços oferecidos pelo salão."
        actions={
          <RoleGate allow={['ADMIN']}>
            <Button variant="outline" onClick={() => setShowInactive((v) => !v)}>
              {showInactive ? 'Mostrar apenas ativos' : 'Mostrar inativos'}
            </Button>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4" /> Novo serviço
            </Button>
          </RoleGate>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar"
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="h-10 w-10" />}
          title="Nenhum serviço"
          description={isAdmin ? 'Crie o primeiro serviço.' : 'O administrador ainda não cadastrou serviços.'}
          action={
            isAdmin ? (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4" /> Novo serviço
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc.id} className={svc.isActive ? '' : 'opacity-60'}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{svc.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {svc.durationMin} min · {formatCurrency(svc.price)}
                    </p>
                  </div>
                  {!svc.isActive ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Inativo</span>
                  ) : null}
                </div>
                {svc.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{svc.description}</p>
                ) : null}
                <RoleGate allow={['ADMIN']}>
                  <div className="flex items-center justify-end gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleActive.mutate({ id: svc.id, isActive: !svc.isActive })
                      }
                      disabled={toggleActive.isPending}
                      aria-label={svc.isActive ? 'Desativar' : 'Ativar'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(svc)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover"
                      disabled={removeMut.isPending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Desativar serviço?',
                          description: `O serviço "${svc.name}" deixará de aparecer para novos agendamentos.`,
                          confirmLabel: 'Desativar',
                          destructive: true,
                        });
                        if (ok) removeMut.mutate(svc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </RoleGate>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />
    </>
  );
}
