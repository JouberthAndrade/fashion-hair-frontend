import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Pencil, UserCog, Wallet } from 'lucide-react';

import { listCollaborators } from '@/api/collaborators';
import { collaboratorKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Avatar } from '@/components/shared/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import { CollaboratorProfileDialog } from './CollaboratorProfileDialog';
import { WorkingHoursEditor } from './WorkingHoursEditor';
import { ServiceRatesEditor } from './ServiceRatesEditor';
import type { Collaborator } from '@/api/types';

export function CollaboratorsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: collaboratorKeys.lists(),
    queryFn: () => listCollaborators(),
  });

  const collaborators = useMemo(() => data ?? [], [data]);

  const [profileDialog, setProfileDialog] = useState<Collaborator | null>(null);
  const [hoursOpenFor, setHoursOpenFor] = useState<string | null>(null);
  const [ratesOpenFor, setRatesOpenFor] = useState<string | null>(null);

  const canEdit = (id: string) => isAdmin || id === userId;

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Perfis profissionais e horários de atendimento."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar"
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : collaborators.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-10 w-10" />}
          title="Nenhum colaborador"
          description="Cadastre usuários com a função de colaborador."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {collaborators.map((c) => {
            const profile = c.collaboratorProfile;
            const isHoursOpen = hoursOpenFor === c.id;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} src={profile?.avatarUrl} size="xl" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{c.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.specialties?.length
                          ? profile.specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')
                          : 'Sem especialidade'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      {profile?.bio ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
                      ) : null}
                    </div>
                    {canEdit(c.id) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProfileDialog(c)}
                        aria-label="Editar perfil"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  {canEdit(c.id) ? (
                    <div className="border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHoursOpenFor(isHoursOpen ? null : c.id)}
                      >
                        <CalendarClock className="h-4 w-4" />
                        {isHoursOpen ? 'Fechar horários' : 'Editar horários'}
                      </Button>
                      {isHoursOpen ? (
                        <div className="mt-3">
                          <WorkingHoursEditor collaboratorId={c.id} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {isAdmin ? (
                    <div className="border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRatesOpenFor(ratesOpenFor === c.id ? null : c.id)}
                      >
                        <Wallet className="h-4 w-4" />
                        {ratesOpenFor === c.id ? 'Fechar taxas' : 'Taxas por serviço'}
                      </Button>
                      {ratesOpenFor === c.id ? (
                        <div className="mt-3">
                          <ServiceRatesEditor collaboratorId={c.id} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {profileDialog ? (
        <CollaboratorProfileDialog
          open={Boolean(profileDialog)}
          onOpenChange={(open) => {
            if (!open) setProfileDialog(null);
          }}
          collaborator={profileDialog}
        />
      ) : null}
    </>
  );
}
