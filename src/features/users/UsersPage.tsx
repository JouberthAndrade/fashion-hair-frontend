import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';

import { deleteUser, listUsers } from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys, userKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { UserFormDialog } from './UserFormDialog';
import { confirm } from '@/components/shared/confirm';
import type { User } from '@/api/types';

export function UsersPage() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: userKeys.list({ search: debounced, page }),
    queryFn: () => listUsers({ search: debounced || undefined, page, limit: 20 }),
  });

  const users = useMemo(() => data?.users ?? [], [data]);
  const meta = data?.meta;

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Usuário desativado.');
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao remover')),
  });

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Administradores e colaboradores que acessam o sistema."
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" /> Novo usuário
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
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
      ) : users.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="Nenhum usuário"
          action={<Button onClick={handleNew}><Plus className="h-4 w-4" /> Novo usuário</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {users.map((u) => (
                <li key={u.id} className={`flex items-center gap-3 p-4 ${u.isActive ? '' : 'opacity-60'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{u.name}</p>
                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {u.role === 'ADMIN' ? 'Admin' : 'Colaborador'}
                      </span>
                      {!u.isActive ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Inativo</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Desativar"
                      disabled={removeMut.isPending || u.id === currentUserId}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Desativar usuário?',
                          description: `"${u.name}" perderá acesso ao sistema, mas o histórico será mantido.`,
                          confirmLabel: 'Desativar',
                          destructive: true,
                        });
                        if (ok) removeMut.mutate(u.id);
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
            Página {meta.page} de {meta.totalPages} ({meta.total} usuários)
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

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} />
    </>
  );
}
