import { useState } from 'react';
import {
  Calendar,
  Users,
  Scissors,
  UserCog,
  Monitor,
  Wallet,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  Clock,
  Phone,
  UserRound,
  ChevronDown,
  ChevronUp,
  BadgeInfo,
  ListChecks,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

type Role = 'COLLABORATOR' | 'ADMIN';

interface Step {
  text: string;
  detail?: string;
}

interface Section {
  id: string;
  icon: typeof Calendar;
  title: string;
  badge?: string;
  intro: string;
  steps: Step[];
  tip?: string;
}

const collaboratorSections: Section[] = [
  {
    id: 'login',
    icon: LogIn,
    title: 'Fazer login',
    intro: 'Acesse o sistema com as credenciais fornecidas pelo administrador.',
    steps: [
      { text: 'Abra o sistema no navegador.' },
      { text: 'Digite seu e-mail e senha nos campos indicados.' },
      { text: 'Clique em "Entrar". Você será redirecionado automaticamente para sua agenda do dia.' },
    ],
    tip: 'Caso esqueça a senha, peça ao administrador para redefini-la em "Usuários".',
  },
  {
    id: 'agenda',
    icon: Calendar,
    title: 'Gerenciar minha agenda',
    intro: 'A agenda mostra todos os atendimentos do dia, organizados por horário.',
    steps: [
      { text: 'No menu lateral, clique em "Minha agenda".' },
      { text: 'Use o seletor de data no topo para navegar entre os dias.' },
      { text: 'Cada card de agendamento exibe: horário, cliente, serviço e valor.' },
      {
        text: 'Para atualizar o status de um atendimento, clique no menu de ações (⋯) do card.',
        detail: 'Status disponíveis: Agendado → Em andamento → Concluído. Você também pode marcar como Cancelado ou No-show.',
      },
      {
        text: 'Para finalizar um atendimento, selecione "Concluído" e confirme no diálogo de checkout.',
        detail: 'O checkout registra o pagamento e encerra o atendimento.',
      },
    ],
    tip: 'O painel do salão (TV do salão) é atualizado em tempo real — os clientes podem acompanhar a fila.',
  },
  {
    id: 'novo-agendamento',
    icon: ListChecks,
    title: 'Criar um novo agendamento',
    intro: 'Registre um novo atendimento diretamente pela sua agenda.',
    steps: [
      { text: 'Na tela "Minha agenda", clique no botão "Novo agendamento".' },
      { text: 'Selecione o cliente (ou crie um novo caso seja a primeira visita).' },
      { text: 'Escolha o serviço desejado na lista.' },
      { text: 'Selecione a data e o horário disponível.' },
      { text: 'Confirme clicando em "Salvar". O agendamento aparece imediatamente na sua agenda.' },
    ],
    tip: 'Os horários disponíveis são calculados automaticamente com base nos seus horários de trabalho cadastrados.',
  },
  {
    id: 'clientes',
    icon: Users,
    title: 'Gerenciar clientes',
    intro: 'Consulte e mantenha atualizado o cadastro dos seus clientes.',
    steps: [
      { text: 'Clique em "Clientes" no menu lateral.' },
      { text: 'Use a busca no topo para encontrar um cliente pelo nome ou telefone.' },
      { text: 'Clique em um cliente para ver ou editar suas informações.' },
      {
        text: 'Para cadastrar um novo cliente, clique no botão "Novo cliente".',
        detail: 'Preencha nome, telefone e observações relevantes (ex.: preferências, alergias).',
      },
    ],
    tip: 'Mantenha o telefone do cliente sempre atualizado — ele é usado para contato rápido direto pelo sistema.',
  },
  {
    id: 'perfil',
    icon: UserRound,
    title: 'Editar meu perfil',
    intro: 'Mantenha seu perfil atualizado para que os clientes saibam sua especialidade.',
    steps: [
      { text: 'Clique em "Meu perfil" no menu lateral.' },
      { text: 'Atualize sua foto, nome e bio conforme necessário.' },
      { text: 'Salve as alterações clicando no botão de confirmação.' },
      {
        text: 'Para alterar a senha, use a seção "Alterar senha" na mesma página.',
        detail: 'Digite a senha atual e a nova senha (mínimo 6 caracteres).',
      },
    ],
  },
  {
    id: 'horarios',
    icon: Clock,
    title: 'Configurar horários de trabalho',
    intro: 'Defina os dias e horários em que você está disponível para atendimento.',
    steps: [
      { text: 'No menu lateral, clique em "Colaboradores".' },
      { text: 'Localize seu próprio card e clique em "Editar".' },
      {
        text: 'Na seção "Horários de trabalho", ative os dias que você trabalha.',
        detail: 'Para cada dia ativo, defina o horário de início e de fim do expediente.',
      },
      { text: 'Salve as alterações. Os novos horários passam a valer imediatamente para novos agendamentos.' },
    ],
    tip: 'Fora dos seus horários cadastrados, nenhum agendamento online pode ser criado para você.',
  },
  {
    id: 'servicos-collab',
    icon: Scissors,
    title: 'Consultar serviços',
    intro: 'Veja todos os serviços oferecidos pelo salão, com duração e preço.',
    steps: [
      { text: 'Clique em "Serviços" no menu lateral.' },
      { text: 'Serviços ativos ficam na aba principal; inativos ficam em uma aba separada.' },
      { text: 'Use as informações de duração para planejar sua agenda com mais precisão.' },
    ],
    tip: 'Apenas administradores podem criar, editar ou desativar serviços.',
  },
  {
    id: 'painel-collab',
    icon: Monitor,
    title: 'Painel do salão',
    intro: 'Acompanhe em tempo real o movimento de todo o salão.',
    steps: [
      { text: 'Clique em "Painel do salão" no menu lateral.' },
      { text: 'Cada coluna representa um colaborador com seus atendimentos do dia.' },
      { text: 'O painel é atualizado automaticamente a cada 30 segundos.' },
      { text: 'Use o ícone de tela cheia para exibir em uma TV ou monitor do salão.' },
    ],
  },
];

const adminSections: Section[] = [
  {
    id: 'usuarios',
    icon: ShieldCheck,
    title: 'Gerenciar usuários',
    badge: 'Apenas Admin',
    intro: 'Crie e gerencie os acessos de todos os colaboradores e administradores.',
    steps: [
      { text: 'Clique em "Usuários" no menu lateral.' },
      {
        text: 'Para criar um novo usuário, clique em "Novo usuário".',
        detail: 'Preencha nome, e-mail, senha inicial e a função: "Colaborador" ou "Administrador".',
      },
      { text: 'Para editar um usuário existente, clique no ícone de edição (lápis) no card do usuário.' },
      {
        text: 'Para desativar um usuário, use o menu de ações do card e selecione "Desativar".',
        detail: 'Usuários desativados não conseguem mais fazer login, mas seus dados históricos são preservados.',
      },
    ],
    tip: 'Nunca compartilhe senhas. Crie um acesso individual para cada colaborador.',
  },
  {
    id: 'servicos-admin',
    icon: Scissors,
    title: 'Gerenciar serviços',
    badge: 'Apenas Admin',
    intro: 'Controle o catálogo de serviços: preços, duração e disponibilidade.',
    steps: [
      { text: 'Clique em "Serviços" no menu lateral.' },
      {
        text: 'Para adicionar um novo serviço, clique em "Novo serviço".',
        detail: 'Informe nome, duração em minutos, preço padrão e se o serviço deve estar ativo imediatamente.',
      },
      { text: 'Para editar um serviço, clique no ícone de edição no card do serviço.' },
      {
        text: 'Para desativar um serviço temporariamente, clique no toggle "Ativo/Inativo".',
        detail: 'Serviços inativos não aparecem para seleção em novos agendamentos.',
      },
    ],
    tip: 'A duração do serviço define os slots de tempo bloqueados na agenda do colaborador.',
  },
  {
    id: 'colaboradores-admin',
    icon: UserCog,
    title: 'Gerenciar colaboradores',
    badge: 'Apenas Admin',
    intro: 'Edite perfis, especialidades e horários de qualquer colaborador.',
    steps: [
      { text: 'Clique em "Colaboradores" no menu lateral.' },
      { text: 'Clique em "Editar" no card de qualquer colaborador.' },
      {
        text: 'Atualize foto, bio, especialidade e horários de trabalho conforme necessário.',
        detail: 'Especialidades disponíveis: Cabeleireiro(a), Manicure, Pedicure, Maquiador(a), Sobrancelha, Esteticista.',
      },
      { text: 'Salve as alterações. As mudanças de horário refletem imediatamente nos agendamentos online.' },
    ],
  },
  {
    id: 'painel-admin',
    icon: Monitor,
    title: 'Painel do salão (visão geral)',
    intro: 'Acompanhe o movimento completo do salão em tempo real.',
    steps: [
      { text: 'Clique em "Painel do salão" no menu lateral.' },
      { text: 'Visualize todos os colaboradores lado a lado com seus atendimentos do dia.' },
      { text: 'Veja o resumo de status: Total, Agendados, Em andamento, Concluídos, Cancelados e No-shows.' },
      {
        text: 'Ative o modo tela cheia para exibir em uma TV do salão.',
        detail: 'O painel atualiza automaticamente a cada 30 segundos sem necessidade de recarregar a página.',
      },
      { text: 'Use o seletor de data para consultar dias anteriores.' },
    ],
  },
  {
    id: 'fechamento',
    icon: Wallet,
    title: 'Fechamento de caixa',
    badge: 'Apenas Admin',
    intro: 'Gere relatórios financeiros e feche períodos de faturamento.',
    steps: [
      { text: 'Clique em "Fechamento de caixa" no menu lateral.' },
      {
        text: 'Selecione o período: Diário, Semanal ou Mensal.',
        detail: 'O relatório mostra receita bruta, repasse do salão e repasse dos colaboradores.',
      },
      {
        text: 'Revise o detalhamento por colaborador e por serviço.',
        detail: 'A porcentagem do salão pode ser configurada globalmente ou por serviço individualmente.',
      },
      {
        text: 'Quando todas as informações estiverem corretas, clique em "Fechar período".',
        detail: 'Um período fechado fica registrado no histórico e não pode mais ser alterado.',
      },
      { text: 'Consulte fechamentos anteriores na aba "Histórico de fechamentos".' },
    ],
    tip: 'Configure a taxa padrão do salão nos serviços antes do primeiro fechamento para garantir cálculos corretos.',
  },
  {
    id: 'agendamento-publico',
    icon: Phone,
    title: 'Agendamento online (clientes)',
    intro: 'Compartilhe o link de agendamento para que clientes marquem horários sozinhos.',
    steps: [
      {
        text: 'O link de agendamento público é: /agendar (sem necessidade de login).',
        detail: 'Compartilhe este link no WhatsApp, Instagram ou site do salão.',
      },
      { text: 'O cliente escolhe: serviço → colaborador → data/horário → dados de contato.' },
      { text: 'O agendamento aparece automaticamente na agenda do colaborador escolhido.' },
      { text: 'Nenhuma ação manual do administrador é necessária para confirmar agendamentos online.' },
    ],
    tip: 'Os horários disponíveis para agendamento online são controlados pelos horários de trabalho cadastrados de cada colaborador.',
  },
];

function StepCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/50"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">{section.title}</span>
            {section.badge && (
              <Badge variant="secondary" className="text-xs">
                {section.badge}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{section.intro}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm text-muted-foreground">{section.intro}</p>
          <ol className="space-y-3">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </span>
                <div className="space-y-1 pt-0.5">
                  <p>{step.text}</p>
                  {step.detail && (
                    <p className="text-xs text-muted-foreground bg-muted/60 rounded px-2 py-1">{step.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {section.tip && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <BadgeInfo className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{section.tip}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function TutorialPage() {
  const userRole = useAuthStore((s) => s.user?.role);
  const defaultTab: Role = userRole === 'ADMIN' ? 'ADMIN' : 'COLLABORATOR';
  const [activeTab, setActiveTab] = useState<Role>(defaultTab);

  const sections = activeTab === 'COLLABORATOR' ? collaboratorSections : adminSections;

  return (
    <>
      <PageHeader
        title="Tutorial do sistema"
        description="Guia passo a passo para facilitar o uso diário do Fashion Hair."
      />

      <div className="space-y-6">
        {/* Tab selector */}
        <div className="inline-flex rounded-lg border bg-card p-1 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('COLLABORATOR')}
            className={cn(
              'rounded-md px-4 transition-all',
              activeTab === 'COLLABORATOR' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
            )}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Colaborador
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('ADMIN')}
            className={cn(
              'rounded-md px-4 transition-all',
              activeTab === 'ADMIN' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
            )}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Administrador
          </Button>
        </div>

        {/* Role description */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            {activeTab === 'COLLABORATOR' ? (
              <div className="flex gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Você é um Colaborador</p>
                  <p className="text-muted-foreground mt-0.5">
                    Como colaborador, você gerencia sua própria agenda, atende clientes e atualiza seus dados de perfil.
                    Clique em cada tópico abaixo para ver o passo a passo detalhado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Você é um Administrador</p>
                  <p className="text-muted-foreground mt-0.5">
                    Como administrador, você tem acesso completo ao sistema: usuários, serviços, fechamento financeiro
                    e visão geral de todos os colaboradores. Clique em cada tópico para ver o guia completo.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Quick overview */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {activeTab === 'COLLABORATOR' ? 'O que você pode fazer' : 'Suas responsabilidades'}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    // Dispatch a synthetic click to open the accordion
                    setTimeout(() => {
                      const el = document.querySelector<HTMLButtonElement>(`#${s.id} button`);
                      const expanded = el?.getAttribute('aria-expanded');
                      if (expanded === 'false') el?.click();
                    }, 350);
                  }}
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {s.title}
                </a>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Sections */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Guias passo a passo
          </h2>
          {sections.map((section) => (
            <div key={section.id} id={section.id}>
              <StepCard section={section} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BadgeInfo className="h-4 w-4 text-primary" />
              Precisa de ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground pb-4">
            Se tiver dúvidas que não estão neste guia, entre em contato com o administrador do sistema.
            Em caso de problemas técnicos, anote o que aconteceu e reporte ao responsável.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
