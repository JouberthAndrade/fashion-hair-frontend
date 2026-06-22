# PRD — Taxas por Colaborador × Serviço, Especialidades Múltiplas e Favicon

**Data:** 2026-06-22  
**Projeto:** Fashion Hair SaaS  
**Branch sugerida:** `feature/collaborator-rates-specialties`  
**Status:** Aprovado pelo usuário

---

## 1. Contexto e Motivação

O salão possui colaboradores com taxas negociadas individualmente com a proprietária. Hoje existe apenas uma taxa global (`SalonSetting.defaultSalonFeeRatePercent`) e uma taxa por serviço (`Service.salonFeeRatePercent`), sem distinção por profissional. Exemplos reais:

| Colaborador | Serviço                   | Preço cobrado | Taxa do salão |
|-------------|---------------------------|---------------|---------------|
| Nilson      | Corte masculino           | R$ 50         | 25%           |
| Nilson      | Corte masculino           | R$ 60         | 25%           |
| Kardec      | Corte masculino           | R$ 70         | 20%           |
| Kardec      | Hidratação e escova       | R$ 150        | 23%           |

Adicionalmente, colaboradoras como Bia exercem **múltiplas especialidades** (manicure + pedicure), o que o schema atual não suporta. Por fim, o preço dos serviços **não deve ser visível** no fluxo de agendamento público (cliente pelo link).

---

## 2. Escopo

| # | Funcionalidade | Área |
|---|----------------|------|
| 1 | Taxa por colaborador × serviço (admin configura) | Backend + Frontend |
| 2 | Especialidades múltiplas por colaborador | Backend + Frontend |
| 3 | Esconder preços no agendamento público | Backend + Frontend |
| 4 | Favicon de tesoura dourada | Frontend (index.html) |

Fora de escopo: relatórios comparativos de taxa, taxa por período, taxa retroativa em agendamentos já fechados.

---

## 3. Modelo de Dados (Backend — Prisma)

### 3.1 Nova tabela: `CollaboratorServiceRate`

```prisma
model CollaboratorServiceRate {
  id                  String   @id @default(uuid())
  collaboratorId      String   @map("collaborator_id")   // User.id
  serviceId           String   @map("service_id")
  salonFeeRatePercent Decimal  @map("salon_fee_rate_percent") @db.Decimal(5, 2)
  updatedById         String?  @map("updated_by_id")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  collaborator User    @relation("CollaboratorRates", fields: [collaboratorId], references: [id])
  service      Service @relation(fields: [serviceId], references: [id])
  updatedBy    User?   @relation("RateUpdatedBy", fields: [updatedById], references: [id])

  @@unique([collaboratorId, serviceId])
  @@index([collaboratorId])
  @@map("collaborator_service_rates")
}
```

### 3.2 Especialidades múltiplas: nova tabela `CollaboratorSpecialty`

```prisma
model CollaboratorSpecialty {
  id                    String    @id @default(uuid())
  collaboratorProfileId String    @map("collaborator_profile_id")
  specialty             Specialty

  collaboratorProfile CollaboratorProfile @relation(fields: [collaboratorProfileId], references: [id])

  @@unique([collaboratorProfileId, specialty])
  @@index([collaboratorProfileId])
  @@map("collaborator_specialties")
}
```

`CollaboratorProfile` passa a ter:
```prisma
specialties CollaboratorSpecialty[]
// campo `specialty Specialty` REMOVIDO após migração
```

### 3.3 Migração não-destrutiva de especialidades

A migration SQL:
1. Cria tabela `collaborator_specialties`
2. Insere uma linha para cada `CollaboratorProfile` que já tem `specialty` não-nulo
3. Remove o campo `specialty` de `collaborator_profiles`

Garante zero perda de dados para colaboradoras existentes.

### 3.4 Campos sem alteração

- `Appointment.salonFeeRateAtBooking` — já existe e snapshota a taxa no momento do agendamento; o fechamento de caixa o lê diretamente.
- `Service.salonFeeRatePercent` — permanece como segundo nível da cascata.
- `SalonSetting.defaultSalonFeeRatePercent` — permanece como base da cascata.

---

## 4. Resolução de Taxa (Cascata)

```
1. CollaboratorServiceRate (collaboratorId + serviceId)   ← NOVO — mais específico
2. Service.salonFeeRatePercent                            ← já existente
3. SalonSetting.defaultSalonFeeRatePercent                ← já existente
```

### Implementação

Função `resolveSalonFeeRate` em `shared/utils/salonFee.ts` recebe um parâmetro adicional `collaboratorId?: string`. Quando fornecido, faz lookup em `CollaboratorServiceRate` antes dos níveis inferiores.

`buildBookingSnapshots` passa a aceitar `{ ..., collaboratorId }` e repassa para `resolveSalonFeeRate`.

Todos os chamadores (`createAppointmentService`, `updateAppointmentService`, `updateStatusService`) já têm `collaboratorId` disponível; apenas adicionam o parâmetro.

---

## 5. API — Gerenciamento de Taxas por Colaborador (Admin)

### `GET /collaborators/:userId/service-rates`

Retorna todos os serviços ativos com a taxa configurada para este colaborador:

```json
[
  {
    "serviceId": "uuid",
    "serviceName": "Corte masculino",
    "durationMin": 30,
    "configuredRate": 25.00,     // null se não configurado → usa cascata
    "effectiveRate": 25.00       // taxa que será usada (já resolvida)
  }
]
```

**Acesso:** `ADMIN` apenas.

### `PUT /collaborators/:userId/service-rates`

Upsert em lote — substitui/cria as taxas enviadas:

```json
{
  "rates": [
    { "serviceId": "uuid", "ratePercent": 25.00 },
    { "serviceId": "uuid", "ratePercent": null }   // null = remove taxa (volta à cascata)
  ]
}
```

- `ratePercent: null` deleta a linha de `CollaboratorServiceRate`, fazendo a cascata voltar ao nível inferior.
- `ratePercent` fora do intervalo [0, 100] → erro 400.
- Operação em transação única.

**Acesso:** `ADMIN` apenas.

---

## 6. API — Especialidades Múltiplas

### `PUT /collaborators/:userId/profile`

Schema atual aceita `{ specialty, bio, avatarUrl }`. Passa a aceitar:

```json
{
  "specialties": ["MANICURE", "PEDICURE"],   // array, mínimo 1 item
  "bio": "...",
  "avatarUrl": "..."
}
```

A implementação substitui todas as entradas em `CollaboratorSpecialty` para este colaborador em uma transação (`deleteMany` + `createMany`).

### `GET /collaborators` e `GET /collaborators/:id`

Passam a retornar `specialties: Specialty[]` (array) em vez de `specialty: Specialty`.

### Agendamento público — filtro de disponibilidade

A query de colaboradores disponíveis para um serviço filtra hoje por `profile.specialty === service.specialty`. Passa a filtrar por:

```prisma
where: {
  collaboratorProfile: {
    specialties: {
      some: { specialty: service.specialty }
    }
  }
}
```

---

## 7. Agendamento Público — Esconder Preços

### Backend (`public-booking.service.ts`)

No select do Prisma que retorna serviços disponíveis para o cliente, o campo `price` é **omitido**:

```ts
select: {
  id: true,
  name: true,
  description: true,
  durationMin: true,
  specialty: true,
  // price: OMITIDO intencionalmente
}
```

### Frontend (public booking)

A tela pública de agendamento não exibe coluna/campo de preço no card de serviço. Somente nome, duração e descrição.

O SPA interno (admin e colaborador logados) continua exibindo preços normalmente.

---

## 8. Favicon — Tesoura Dourada

**Arquivo:** `fashion-hair-frontend/public/favicon.svg`  
**Referência em `index.html`:**

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

O SVG renderiza uma tesoura estilizada na cor dourada (`#C9A84C`). Substitui qualquer favicon genérico existente. Funciona como vetor (sem pixelação em qualquer resolução).

---

## 9. UI Admin — Tela de Configuração de Taxas

A configuração de taxas é exposta **dentro da tela de Colaboradores existente**, como uma nova seção expansível (accordion) abaixo dos horários de trabalho.

### Layout da seção

```
▼ Taxas por serviço
┌────────────────────────────────────────────────────────────┐
│ Serviço             Duração   Taxa configurada  Efetiva   │
│ Corte masculino     30 min    [ 25,00 % ]       25,00%    │
│ Hidratação e escova 60 min    [ 23,00 % ]       23,00%    │
│ Manicure            40 min    [        ] vazio   40,00%¹  │
└────────────────────────────────────────────────────────────┘
  ¹ Usa taxa do serviço ou global
                                          [Salvar taxas]
```

- Campo vazio = nenhuma taxa específica (cascata ativa).
- A coluna "Efetiva" exibe o valor que será usado no próximo agendamento (resolvido pelo backend).
- Botão "Salvar taxas" chama `PUT /collaborators/:id/service-rates`.
- Visível e editável apenas por `ADMIN`.

### Especialidades múltiplas na UI

O campo atual `<Select>` único de especialidade é substituído por um grupo de **checkboxes** com os valores do enum `Specialty` (labels em PT: Cabeleireiro, Manicure, Pedicure etc.). Mínimo 1 selecionado obrigatório.

---

## 10. Enums e Labels

Verificar se todos os valores de `Specialty` já têm label em PT em `enumLabels.ts`. Adicionar caso faltem.

---

## 11. Critérios de Aceite

| # | Critério |
|---|----------|
| 1 | Admin pode configurar taxa (%) para Nilson + Corte; ao criar agendamento, `salonFeeRateAtBooking` recebe 25% |
| 2 | Kardec com 20% (corte) e 23% (hidratação) — cada agendamento snapshota a taxa correta |
| 3 | Serviço sem taxa de colaborador usa `Service.salonFeeRatePercent`; se também nulo, usa global |
| 4 | Bia pode ter MANICURE + PEDICURE simultâneos; aparece como disponível para ambas na agenda pública |
| 5 | Endpoint público de serviços não retorna o campo `price` |
| 6 | Tela pública de agendamento não exibe preço em nenhum momento |
| 7 | Fechamento de caixa continua calculando corretamente (usa `salonFeeRateAtBooking` snapshotado) |
| 8 | Migração de especialidades não perde dados dos colaboradores existentes |
| 9 | Favicon de tesoura dourada exibido na aba do browser |

---

## 12. Arquivos a Criar/Modificar

### Backend
- `prisma/schema.prisma` — novos modelos + remoção de `specialty` singular
- `prisma/migrations/…` — migration SQL gerada pelo Prisma
- `src/shared/utils/salonFee.ts` — cascata de taxa atualizada
- `src/modules/cash-closing/cash-closing.service.ts` — `buildBookingSnapshots` recebe `collaboratorId`
- `src/modules/appointments/appointments.service.ts` — passa `collaboratorId` para snapshots
- `src/modules/collaborators/collaborators.service.ts` — suporte a `specialties[]`, novos métodos de taxa
- `src/modules/collaborators/collaborators.schema.ts` — schemas Zod atualizados
- `src/modules/collaborators/collaborators.routes.ts` — novas rotas de taxa
- `src/modules/collaborators/collaborators.controller.ts` — novos handlers de taxa
- `src/modules/public-booking/public-booking.service.ts` — omitir `price` do select

### Frontend
- `index.html` — trocar favicon
- `public/favicon.svg` — novo arquivo SVG tesoura dourada
- `src/api/collaborators.ts` — novo endpoint de taxas, `specialties[]`
- `src/api/types.ts` — `specialties: Specialty[]`, novo tipo `CollaboratorServiceRate`
- `src/features/collaborators/CollaboratorsPage.tsx` — seção de taxas + multi-select de especialidade
- `src/features/collaborators/ServiceRatesEditor.tsx` — novo componente (tabela de taxas editável)
- `src/lib/enumLabels.ts` — verificar labels de Specialty
- `src/features/public-booking/…` — remover exibição de preço (se existir)
