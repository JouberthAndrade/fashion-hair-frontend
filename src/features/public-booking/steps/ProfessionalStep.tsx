import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, User } from 'lucide-react';
import { listPublicCollaborators } from '@/api/publicBooking';
import { getApiErrorMessage } from '@/api/client';
import { publicBookingKeys } from '@/lib/queryKeys';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookingSelectionBar } from '../components/BookingSelectionBar';
import type { PublicCollaborator, PublicService } from '@/api/publicBooking';
import type { Specialty } from '@/api/types';

type Props = {
  service: PublicService;
  onPick: (collaborator: PublicCollaborator) => void;
  onBack: () => void;
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function ProfessionalStep({ service, onPick, onBack }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: publicBookingKeys.collaborators(service.id),
    queryFn: () => listPublicCollaborators(service.id),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <BookingSelectionBar service={service} onChangeService={onBack} />

      <div>
        <h2 className="text-xl font-semibold">Quem vai te atender?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Profissionais disponíveis para {service.name.toLowerCase()}.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}

      {isError ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, 'Erro ao carregar profissionais')}
          </p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState
          title="Nenhum profissional disponível"
          description="Não há profissionais cadastrados para este serviço no momento. Escolha outro serviço ou entre em contato com o salão."
        />
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((collaborator) => {
            const specialty =
              collaborator.specialty != null
                ? SPECIALTY_LABELS[collaborator.specialty as Specialty]
                : null;

            return (
              <button
                key={collaborator.id}
                type="button"
                onClick={() => onPick(collaborator)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all',
                  'hover:border-primary hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]',
                )}
              >
                {collaborator.avatarUrl ? (
                  <img
                    src={collaborator.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(collaborator.name) || <User className="h-5 w-5" />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold group-hover:text-primary">{collaborator.name}</p>
                  {specialty ? <p className="text-sm text-muted-foreground">{specialty}</p> : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
