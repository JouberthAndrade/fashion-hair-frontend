# Design — Redesign UI/UX Fashion Hair (Mobile-First)

**Data:** 2026-06-22
**Branch:** `feature/ui-redesign-mobile-first`
**Status:** Aprovado (design) — pendente plano de implementação

## Contexto

O frontend `fashion-hair-frontend` é uma SPA **React 19 + Vite + Tailwind v4 + Radix/shadcn + react-router-dom v7 + TanStack Query**, com estrutura por *feature* (`src/features/*`) e componentes compartilhados em `src/components/shared` e `src/components/ui`. Os profissionais usam principalmente o celular; o desktop é para gestão.

O objetivo é dar identidade visual de marca (dourado/elegante, mobile-first), melhorar a navegação no celular e mitigar um erro de `removeChild` relatado.

### Decisões do usuário (brainstorming)
- **Entrega em fases**, com validação entre cada uma.
- **Dourado como acento** (não cor primária dominante): primary passa de roxo para um **neutro escuro**; dourado em estados ativos, FAB e destaques pontuais.
- **Bottom nav por papel** (rotas são gateadas por papel).
- **Bug `removeChild`**: tratar de forma **defensiva** (não foi reproduzido; é suspeita do prompt).

## Divergências do prompt original vs. realidade (importante)

O prompt assumia uma estrutura genérica que **não corresponde** ao código:
- Não existe `src/pages/`, `components/layout/Sidebar.tsx`, `globals.css`. O layout vive em `src/components/shared/AppLayout.tsx`; rotas em `src/routes/router.tsx`.
- Tailwind é **v4** — tokens vão em `@theme` dentro de `src/index.css`, não em `:root`/`globals.css`.
- **Já existem**: `EmptyState`, `StatusBadge`, `PageHeader`, `sheet.tsx` (suporta `side="bottom"`), diálogos Radix, e **`sonner`** para toasts.
- Rotas são **gateadas por papel**: ADMIN → `/painel`, `/servicos`, `/colaboradores`, `/usuarios`, `/fechamento-caixa`; colaborador → `/agenda`, `/clientes`, `/perfil`, `/tutorial`. Os paths do prompt (`/`, `/novo`, `/caixa`) não existem.

### Itens do prompt descartados (YAGNI)
- **`Toast.tsx`** — já coberto por `sonner` (`<Toaster position="top-right" richColors closeButton />`).
- **`portal-root` + correção de `key`** — Radix já faz portal para `body`; `CollaboratorsPage` já usa `key={c.id}` e não manipula DOM. Nenhuma correção necessária aqui; documentado para evitar trabalho inútil.

## A. Tokens visuais (Tailwind v4)

Editar `src/index.css` (bloco `@theme`):
- Adicionar marca: `--color-gold (#C9A84C)`, `--color-gold-light (#E8C97A)`, `--color-gold-muted (rgba(201,168,76,0.15))`, `--color-brand-dark (#1A1A1A)`, superfícies quentes (`--color-surface #F9F7F4`, `--color-border #E8E4DF`).
- Repontar `--color-primary` (roxo `262 83%`) → **neutro escuro** (brand-dark). `--color-accent`/`--color-accent-foreground`/`--color-ring` → tons de dourado.
- Manter `--color-status-*` existentes (já cobrem scheduled/in-progress/done/cancelled/no-show).
- Tipografia: `--font-display: 'Playfair Display'`, `--font-body: 'Inter'`. Carregar via `<link>` no `index.html` com `display=swap`. Aplicar Playfair nos títulos (`PageHeader`).
- Raios: já há `--radius: 0.625rem`; adicionar `--radius-lg`/`--radius-xl` p/ cards/sheets.

**Critério:** dourado é acento pontual; CTAs continuam neutros (brand-dark). Sem inundar de ouro.

## B. Mitigação do bug `removeChild` (defensiva)

- Criar `src/components/shared/ErrorBoundary.tsx` (class component com `getDerivedStateFromError`/`componentDidCatch` + fallback com botão "Tentar novamente").
- Envolver `<RouterProvider>` em `src/main.tsx`.
- `index.html`: `<html lang="pt-BR" translate="no">` + `class="notranslate"` no body para impedir que extensões de tradução (Google Translate/Grammarly) mutem text nodes — causa real mais comum desse erro em React 19.
- **Não** adicionar `portal-root` nem mexer em keys (já corretos).

## C. Shell de layout

`AppLayout.tsx` já tem sidebar desktop + Sheet drawer mobile. Mudanças:
- **Sidebar (desktop ≥1024px / md atual)**: fundo dark (`brand-dark`), texto claro; item ativo com `gold-muted` de fundo + **borda-left 3px dourada**; bloco de usuário (nome/papel); logo "Fashion Hair" em Playfair.
- **`BottomNav.tsx` (novo, mobile <768px)**: itens **por papel** + **FAB dourado elevado** central abrindo Novo Agendamento.
  - ADMIN: Painel, Agenda, **+Novo**, Clientes, Caixa(`/fechamento-caixa`).
  - Colaborador: Agenda, Clientes, **+Novo**, Perfil.
  - FAB: 56px, círculo, `bg-gold`, ícone branco, `translateY(-12px)`, `shadow-gold`.
- **Header mobile**: compacto (logo + avatar); o drawer Sheet vira secundário.
- `main` ganha `padding-bottom` igual à altura do bottom nav no mobile (`--bottom-nav-height`).

## D. Telas

- **Dashboard** (`features/dashboard/SalonDisplayPage.tsx` + `CollaboratorColumn.tsx`): StatusCards com ícone contextual, número grande (28–32px/600), label uppercase, fundo de acento sutil por status (mapa de cores do prompt). Mobile: grid 2x3 + cards de colaborador expansíveis (accordion). Desktop: linha horizontal + colunas.
- **Agenda** (`features/appointments/MyAgendaPage.tsx`): *date strip* horizontal com scroll (marcador ● em dias com agendamento), timeline vertical de cards. Prioridade mobile.
- **Colaboradores** (`features/collaborators/CollaboratorsPage.tsx`): polir cards (avatar com iniciais, contagem do dia). Sem refatoração estrutural (já saudável).
- **Novo Agendamento** (`features/appointments/CreateAppointmentDialog.tsx`): no mobile, virar **bottom sheet** (`Sheet side="bottom"`) com drag handle; no desktop continua dialog.

## E. Componentes globais

- **`Avatar` com iniciais**: usar `@radix-ui/react-avatar` (já instalado) com fallback de cor por hash do nome (paleta de 8 tons harmônicos). Tamanhos sm/md/lg/xl.
- **`StatusPill`**: refinar a partir do `StatusBadge` existente — pill 11px uppercase + ícone pequeno (acessibilidade).
- **`EmptyState`**: já existe; garantir título + subtítulo com CTA (não texto solto).

## Plano por fases

1. **Fase 1 — Fundação:** tokens (`@theme`) + fontes (`index.html`) + `ErrorBoundary` + guarda de tradução. Baixo risco.
2. **Fase 2 — Shell:** sidebar redesenhada + `BottomNav` por papel + header mobile.
3. **Fase 3 — Telas principais:** Dashboard (StatusCards/colaboradores) + Agenda (date strip).
4. **Fase 4 — Detalhe:** Colaboradores polish + Novo Agendamento bottom sheet + `Avatar`/`StatusPill`.

## Critérios de aceite

- [ ] Sem `removeChild` no console; `ErrorBoundary` captura erros sem derrubar o app.
- [ ] Bottom Navigation visível/funcional em `<768px`, itens corretos por papel.
- [ ] Sidebar apenas em viewport desktop.
- [ ] Tokens dourados aplicados via `@theme`; Playfair + Inter carregadas.
- [ ] Dashboard com novos StatusCards; Agenda com date strip.
- [ ] Empty states com CTA.
- [ ] Listas com `key` estável por `id` (verificado — já conforme).
- [ ] `pnpm/npm run build` e `lint` passam; testes existentes (vitest) verdes.

## Não-objetivos

- Sem mudanças no backend.
- Sem refatoração não relacionada (ex.: public-booking, fora do escopo).
- Sem novo sistema de toast (usar `sonner`).
