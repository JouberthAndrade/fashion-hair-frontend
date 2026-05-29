import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Banknote,
  CheckCircle2,
  Lock,
  RefreshCw,
  Settings2,
  Users,
  Scissors,
} from 'lucide-react';

import {
  closeCash,
  getCashClosingHistory,
  getCashClosingReport,
  getCashClosingSettings,
  updateCashClosingSettings,
  updateServiceFee,
} from '@/api/cashClosing';
import { getApiErrorMessage } from '@/api/client';
import type { CashClosingPeriod } from '@/api/types';
import { cashClosingKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDateShort, todayISO } from '@/lib/date';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { confirm } from '@/components/shared/confirm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: CashClosingPeriod; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

const PERIOD_LABEL: Record<CashClosingPeriod, string> = {
  day: 'Diário',
  week: 'Semanal',
  month: 'Mensal',
};

function formatPeriodRange(start: string, end: string): string {
  if (start === end) return formatDateShort(start);
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', className)}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function BreakdownTable({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Users;
  rows: Array<{
    id: string;
    name: string;
    count: number;
    gross: number;
    salonShare: number;
    collaboratorShare: number;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum atendimento concluído no período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium text-right">Qtd</th>
              <th className="px-4 py-2 font-medium text-right">Bruto</th>
              <th className="px-4 py-2 font-medium text-right">Salão</th>
              <th className="px-4 py-2 font-medium text-right">Colaborador</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{row.name}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.count}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(row.gross)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                  {formatCurrency(row.salonShare)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-blue-700">
                  {formatCurrency(row.collaboratorShare)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SalonFeeSettingsCard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: cashClosingKeys.settings(),
    queryFn: getCashClosingSettings,
  });

  const [defaultRate, setDefaultRate] = useState<string>('');
  const [serviceRates, setServiceRates] = useState<Record<string, string>>({});

  const settingsMut = useMutation({
    mutationFn: (rate: number) => updateCashClosingSettings({ defaultSalonFeeRatePercent: rate }),
    onSuccess: () => {
      toast.success('Taxa padrão atualizada.');
      qc.invalidateQueries({ queryKey: cashClosingKeys.settings() });
      qc.invalidateQueries({ queryKey: cashClosingKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar taxa padrão')),
  });

  const serviceMut = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number | null }) =>
      updateServiceFee(id, { salonFeeRatePercent: rate }),
    onSuccess: () => {
      toast.success('Taxa do serviço atualizada.');
      qc.invalidateQueries({ queryKey: cashClosingKeys.settings() });
      qc.invalidateQueries({ queryKey: cashClosingKeys.all });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar taxa do serviço')),
  });

  const effectiveDefault = data?.defaultSalonFeeRatePercent ?? 40;
  const defaultInput = defaultRate !== '' ? defaultRate : String(effectiveDefault);

  const handleSaveDefault = () => {
    const n = Number(defaultInput);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      toast.error('Informe uma taxa entre 0 e 100.');
      return;
    }
    settingsMut.mutate(n);
  };

  const handleSaveService = (serviceId: string) => {
    const raw = serviceRates[serviceId];
    if (raw === undefined || raw.trim() === '') {
      serviceMut.mutate({ id: serviceId, rate: null });
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      toast.error('Informe uma taxa entre 0 e 100 ou deixe vazio para usar a padrão.');
      return;
    }
    serviceMut.mutate({ id: serviceId, rate: n });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4" /> Configurações de taxa
        </CardTitle>
        <CardDescription>
          Defina a taxa retida pelo salão. Serviços sem taxa específica usam a taxa padrão (
          {effectiveDefault}%).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="default-fee">Taxa padrão do salão (%)</Label>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <Input
                id="default-fee"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-32"
                value={defaultInput}
                onChange={(e) => setDefaultRate(e.target.value)}
              />
            )}
          </div>
          <Button onClick={handleSaveDefault} disabled={settingsMut.isPending || isLoading}>
            Salvar padrão
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 font-medium">Serviço</th>
                <th className="px-4 py-2 font-medium text-right">Preço</th>
                <th className="px-4 py-2 font-medium text-right">Taxa (%)</th>
                <th className="px-4 py-2 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={4} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : (data?.services ?? []).map((svc) => {
                    const placeholder =
                      svc.salonFeeRatePercent != null
                        ? String(svc.salonFeeRatePercent)
                        : `padrão (${effectiveDefault}%)`;
                    const value = serviceRates[svc.id] ?? '';
                    return (
                      <tr key={svc.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{svc.name}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(svc.price)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            placeholder={placeholder}
                            className="ml-auto w-28 text-right"
                            value={value}
                            onChange={(e) =>
                              setServiceRates((prev) => ({ ...prev, [svc.id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={serviceMut.isPending}
                            onClick={() => handleSaveService(svc.id)}
                          >
                            Salvar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function CashClosingPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<CashClosingPeriod>('day');
  const [date, setDate] = useState(todayISO());

  const reportQuery = useQuery({
    queryKey: cashClosingKeys.report(period, date),
    queryFn: () => getCashClosingReport(period, date),
  });

  const historyQuery = useQuery({
    queryKey: cashClosingKeys.history(),
    queryFn: () => getCashClosingHistory(),
  });

  const closeMut = useMutation({
    mutationFn: () => closeCash({ period, date }),
    onSuccess: () => {
      toast.success('Caixa fechado com sucesso.');
      qc.invalidateQueries({ queryKey: cashClosingKeys.report(period, date) });
      qc.invalidateQueries({ queryKey: cashClosingKeys.history() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao fechar caixa')),
  });

  const report = reportQuery.data;
  const summary = report?.summary;
  const periodLabel = report
    ? formatPeriodRange(report.periodStart, report.periodEnd)
    : formatDateShort(date);

  const handleClose = async () => {
    if (!report || report.isClosed) return;
    if (report.summary.appointmentCount === 0) {
      toast.error('Não há atendimentos concluídos para fechar neste período.');
      return;
    }

    const ok = await confirm({
      title: `Fechar caixa ${PERIOD_LABEL[period].toLowerCase()}?`,
      description: `Período: ${periodLabel}. Bruto: ${formatCurrency(report.summary.totalGross)}. Esta ação registra o fechamento e não pode ser desfeita.`,
      confirmLabel: 'Fechar caixa',
      destructive: true,
    });
    if (ok) closeMut.mutate();
  };

  return (
    <>
      <PageHeader
        title="Fechamento de caixa"
        description="Controle de receitas, taxas do salão e fechamentos por dia, semana ou mês."
        actions={
          <>
            <div className="flex rounded-lg border bg-muted/30 p-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    period === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => reportQuery.refetch()}
              aria-label="Atualizar"
            >
              <RefreshCw className={cn('h-4 w-4', reportQuery.isFetching && 'animate-spin')} />
            </Button>
            <Button
              onClick={handleClose}
              disabled={closeMut.isPending || report?.isClosed || reportQuery.isLoading}
            >
              <Lock className="h-4 w-4" /> Fechar caixa
            </Button>
          </>
        }
      />

      {reportQuery.isLoading ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : reportQuery.isError ? (
        <EmptyState
          title="Erro ao carregar relatório"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="outline" onClick={() => reportQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : report && summary ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{PERIOD_LABEL[report.period]}</Badge>
            <span className="text-sm text-muted-foreground">{periodLabel}</span>
            {report.isClosed && report.closing ? (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Fechado por {report.closing.closedByName} em{' '}
                {formatDateShort(report.closing.closedAt.split('T')[0])}
              </Badge>
            ) : (
              <Badge variant="outline">Aberto</Badge>
            )}
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Atendimentos concluídos"
              value={summary.appointmentCount}
              className="bg-card"
            />
            <SummaryCard
              label="Receita bruta"
              value={formatCurrency(summary.totalGross)}
              className="bg-blue-50 text-blue-950"
            />
            <SummaryCard
              label="Parte do salão"
              value={formatCurrency(summary.totalSalonShare)}
              className="bg-emerald-50 text-emerald-950"
            />
            <SummaryCard
              label="Parte colaboradores"
              value={formatCurrency(summary.totalCollaboratorShare)}
              className="bg-violet-50 text-violet-950"
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="Por colaborador" icon={Users} rows={report.byCollaborator} />
            <BreakdownTable title="Por serviço" icon={Scissors} rows={report.byService} />
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4" /> Atendimentos do período
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 pb-2">
              {report.appointments.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">
                  Nenhum atendimento concluído neste período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Data</th>
                      <th className="px-4 py-2 font-medium">Cliente</th>
                      <th className="px-4 py-2 font-medium">Serviço</th>
                      <th className="px-4 py-2 font-medium">Colaborador</th>
                      <th className="px-4 py-2 font-medium text-right">Taxa</th>
                      <th className="px-4 py-2 font-medium text-right">Bruto</th>
                      <th className="px-4 py-2 font-medium text-right">Salão</th>
                      <th className="px-4 py-2 font-medium text-right">Colab.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.appointments.map((appt) => (
                      <tr key={appt.id} className="border-b last:border-0">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatDateShort(appt.scheduledDate)} {appt.startTime}
                        </td>
                        <td className="px-4 py-2">{appt.clientName}</td>
                        <td className="px-4 py-2">{appt.serviceName}</td>
                        <td className="px-4 py-2">{appt.collaboratorName}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {appt.salonFeeRatePercent}%
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(appt.gross)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                          {formatCurrency(appt.salonShare)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-blue-700">
                          {formatCurrency(appt.collaboratorShare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="mb-6">
        <SalonFeeSettingsCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de fechamentos</CardTitle>
          <CardDescription>Últimos fechamentos registrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-2">
          {historyQuery.isLoading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (historyQuery.data?.length ?? 0) === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhum fechamento registrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Período</th>
                  <th className="px-4 py-2 font-medium">Intervalo</th>
                  <th className="px-4 py-2 font-medium text-right">Atend.</th>
                  <th className="px-4 py-2 font-medium text-right">Bruto</th>
                  <th className="px-4 py-2 font-medium text-right">Salão</th>
                  <th className="px-4 py-2 font-medium">Fechado por</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {historyQuery.data?.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{PERIOD_LABEL[item.period]}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatPeriodRange(item.periodStart, item.periodEnd)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{item.appointmentCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(item.totalGross)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                      {formatCurrency(item.totalSalonShare)}
                    </td>
                    <td className="px-4 py-2">{item.closedByName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateShort(item.closedAt.split('T')[0])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
