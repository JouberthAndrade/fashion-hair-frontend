import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';

import { getDailyDashboard } from '@/api/dashboard';
import { dashboardKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useFullscreen } from '@/hooks/useFullscreen';
import { todayISO, formatDateLong } from '@/lib/date';
import { CollaboratorColumn } from './CollaboratorColumn';

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
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          <SummaryCard label="Total" value={summary.totalAppointments} className="bg-card" />
          <SummaryCard
            label="Agendados"
            value={summary.scheduled}
            className="bg-blue-50 text-blue-900"
          />
          <SummaryCard
            label="Em atendimento"
            value={summary.inProgress}
            className="bg-yellow-50 text-yellow-900"
          />
          <SummaryCard
            label="Concluídos"
            value={summary.done}
            className="bg-green-50 text-green-900"
          />
          <SummaryCard
            label="Cancelados"
            value={summary.cancelled}
            className="bg-gray-50 text-gray-700"
          />
          <SummaryCard
            label="Não compareceu"
            value={summary.noShow}
            className="bg-red-50 text-red-900"
          />
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
        <div
          className={`grid h-[calc(100vh-220px)] gap-4 ${
            collaborators.length <= 2
              ? 'grid-cols-1 md:grid-cols-2'
              : collaborators.length <= 4
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}
        >
          {collaborators.map((c) => (
            <CollaboratorColumn
              key={c.id}
              name={c.name}
              specialty={c.collaboratorProfile?.specialty}
              avatarUrl={c.collaboratorProfile?.avatarUrl}
              appointments={c.appointments}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  className?: string;
}

function SummaryCard({ label, value, className }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-3 ${className ?? ''}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
