import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  CalendarRange,
  CalendarClock,
  Scissors,
  CheckCircle2,
  Ban,
  UserX,
} from 'lucide-react';

import { getDailyDashboard } from '@/api/dashboard';
import { dashboardKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusCard } from '@/components/shared/StatusCard';
import { useFullscreen } from '@/hooks/useFullscreen';
import { todayISO, formatDateLong } from '@/lib/date';
import { CollaboratorColumn } from './CollaboratorColumn';
import { CollaboratorAccordionCard } from './CollaboratorAccordionCard';

const REFRESH_MS = 30_000;

export function SalonDisplayPage() {
  const [date, setDate] = useState(todayISO());
  const { isFullscreen, toggle } = useFullscreen();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: dashboardKeys.daily(date),
    queryFn: () => getDailyDashboard(date),
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  const summary = data?.summary;
  const collaborators = useMemo(() => data?.collaborators ?? [], [data]);

  return (
    <>
      <PageHeader
        title="Painel do salão"
        description={formatDateLong(date)}
        actions={
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Atualizar">
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={toggle}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Sair' : 'Tela cheia'}
            </Button>
          </>
        }
      />

      {summary ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatusCard label="Total" value={summary.totalAppointments} icon={CalendarRange} tone="total" />
          <StatusCard label="Agendados" value={summary.scheduled} icon={CalendarClock} tone="scheduled" />
          <StatusCard label="Em atendimento" value={summary.inProgress} icon={Scissors} tone="in-progress" />
          <StatusCard label="Concluídos" value={summary.done} icon={CheckCircle2} tone="done" />
          <StatusCard label="Cancelados" value={summary.cancelled} icon={Ban} tone="cancelled" />
          <StatusCard label="Não compareceu" value={summary.noShow} icon={UserX} tone="no-show" />
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[60vh] w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar o painel"
          description="Tente atualizar manualmente."
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      ) : collaborators.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador encontrado"
          description="Cadastre colaboradores para visualizar o painel."
        />
      ) : (
        <>
          {/* Mobile / tablet: stacked expandable cards */}
          <div className="space-y-3 lg:hidden">
            {collaborators.map((c) => (
              <CollaboratorAccordionCard
                key={c.id}
                name={c.name}
                specialties={c.collaboratorProfile?.specialties ?? []}
                appointments={c.appointments}
                defaultOpen={collaborators.length === 1}
              />
            ))}
          </div>

          {/* Desktop / TV display: side-by-side columns */}
          <div
            className={`hidden h-[calc(100vh-220px)] gap-4 lg:grid ${
              collaborators.length <= 4
                ? 'grid-cols-2 xl:grid-cols-4'
                : 'grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            }`}
          >
            {collaborators.map((c) => (
              <CollaboratorColumn
                key={c.id}
                name={c.name}
                specialties={c.collaboratorProfile?.specialties ?? []}
                avatarUrl={c.collaboratorProfile?.avatarUrl}
                appointments={c.appointments}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
