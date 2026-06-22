import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Pencil, UserCog } from 'lucide-react';

import { getCollaborator } from '@/api/collaborators';
import { collaboratorKeys } from '@/lib/queryKeys';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { CollaboratorProfileDialog } from '@/features/collaborators/CollaboratorProfileDialog';
import { WorkingHoursEditor } from '@/features/collaborators/WorkingHoursEditor';

interface CollaboratorProfileSectionProps {
  userId: string;
}

export function CollaboratorProfileSection({ userId }: CollaboratorProfileSectionProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const { data: collaborator, isLoading, isError, refetch } = useQuery({
    queryKey: collaboratorKeys.detail(userId),
    queryFn: () => getCollaborator(userId),
  });

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-48 w-full lg:col-span-1" />
        <Skeleton className="h-64 w-full lg:col-span-2" />
      </>
    );
  }

  if (isError || !collaborator) {
    return (
      <div className="lg:col-span-2">
        <EmptyState
          title="Não foi possível carregar seu perfil profissional"
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      </div>
    );
  }

  const profile = collaborator.collaboratorProfile;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" /> Perfil profissional
              </CardTitle>
              <CardDescription>Especialidade e informações exibidas aos clientes.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={collaborator.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UserCog className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">
                {profile?.specialties?.length
                  ? profile.specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')
                  : 'Sem especialidade'}
              </p>
              {profile?.bio ? (
                <p className="text-muted-foreground">{profile.bio}</p>
              ) : (
                <p className="text-muted-foreground">Nenhuma bio cadastrada.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> Horários de atendimento
          </CardTitle>
          <CardDescription>Defina os dias e horários em que você atende.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkingHoursEditor collaboratorId={userId} />
        </CardContent>
      </Card>

      <CollaboratorProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        collaborator={collaborator}
      />
    </>
  );
}
