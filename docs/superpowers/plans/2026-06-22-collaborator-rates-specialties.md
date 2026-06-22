# Collaborator Rates & Specialties — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar taxa por colaborador × serviço, múltiplas especialidades por colaborador, e esconder preços no booking público, mais favicon de tesoura dourada.

**Architecture:** Nova tabela `CollaboratorServiceRate` (matriz colaborador × serviço) alimenta a cascata de taxa no helper `resolveSalonFeeRate`; `CollaboratorSpecialty` substitui o campo `specialty` singular no perfil do colaborador via migração não-destrutiva; agendamentos continuam snapshotando a taxa resolvida em `salonFeeRateAtBooking` — sem impacto no fechamento de caixa existente.

**Tech Stack:** Fastify + Prisma 7 + PostgreSQL (Node.js CJS/tsx), React 19 + Vite + TypeScript + TanStack Query v5 + Zustand

## Global Constraints

- Node.js ≥ 22.12.0
- Zod v4 (`z.nativeEnum`, não `z.enum`) para Prisma enums no backend
- Backend usa `commonjs` (`"type": "commonjs"`) + ESM imports com `.js` extension em imports locais
- Frontend usa aliases `@/` mapeados para `src/`
- Nenhum comentário no código além dos já existentes nos arquivos não tocados
- Commits em inglês, mensagem curta + `Co-Authored-By`
- Testes: `npm test` em `fashion-hair-backend` (Node built-in test runner via `tsx --test`)

---

## Mapa de Arquivos

### Backend (`fashion-hair-backend`)

| Arquivo | Ação |
|---------|------|
| `prisma/schema.prisma` | Modificar: add `CollaboratorServiceRate`, `CollaboratorSpecialty`; remove `specialty` singular de `CollaboratorProfile` |
| `prisma/migrations/<ts>_…/migration.sql` | Criar: gerado + editado para data migration |
| `src/shared/utils/salonFee.ts` | Modificar: `resolveSalonFeeRate` aceita `collaboratorId?` e consulta `CollaboratorServiceRate` |
| `src/shared/utils/serviceSpecialty.ts` | Modificar: `collaboratorMatchesService` aceita `Specialty[]` |
| `src/shared/utils/serviceSpecialty.test.ts` | Modificar: atualizar testes para aceitar array |
| `src/modules/cash-closing/cash-closing.service.ts` | Modificar: `buildBookingSnapshots` aceita `options.collaboratorId` |
| `src/modules/appointments/appointments.service.ts` | Modificar: 3 chamadas a `buildBookingSnapshots` passam `collaboratorId` |
| `src/modules/dashboard/dashboard.service.ts` | Modificar: select `specialties` em vez de `specialty` |
| `src/modules/collaborators/collaborators.schema.ts` | Modificar: `specialty` → `specialties[]`; add schemas de taxa |
| `src/modules/collaborators/collaborators.service.ts` | Modificar: perfil com `specialties[]`; add `listServiceRatesService`, `upsertServiceRatesService` |
| `src/modules/collaborators/collaborators.routes.ts` | Modificar: add rotas `GET/PUT /:id/service-rates` |
| `src/modules/collaborators/collaborators.controller.ts` | Modificar: add handlers de taxa |
| `src/modules/public-booking/public-booking.service.ts` | Modificar: remove `price`; usa `specialties[]` para filtro |

### Frontend (`fashion-hair-frontend`)

| Arquivo | Ação |
|---------|------|
| `public/favicon.svg` | Criar: tesoura dourada SVG |
| `index.html` | Modificar: link favicon |
| `src/api/types.ts` | Modificar: `CollaboratorProfile.specialties: Specialty[]`; add `CollaboratorServiceRate` |
| `src/api/collaborators.ts` | Modificar: `upsertProfile` aceita `specialties[]`; add `getServiceRates`, `updateServiceRates` |
| `src/api/publicBooking.ts` | Modificar: remove `price` de `PublicService` e `PublicAppointmentResult.service` |
| `src/features/collaborators/CollaboratorProfileDialog.tsx` | Modificar: `<Select>` → checkboxes multi-select |
| `src/features/collaborators/ServiceRatesEditor.tsx` | Criar: tabela editável de taxas por serviço |
| `src/features/collaborators/CollaboratorsPage.tsx` | Modificar: integrar `ServiceRatesEditor` |
| `src/features/dashboard/CollaboratorAccordionCard.tsx` | Modificar: `specialty?` → `specialties: Specialty[]` |
| `src/features/dashboard/CollaboratorColumn.tsx` | Modificar: adaptar para `specialties[]` |
| `src/features/dashboard/SalonDisplayPage.tsx` | Modificar: passar `specialties` em vez de `specialty` |
| `src/api/types.ts` (`DailyDashboardResponse`) | Modificar: `collaboratorProfile.specialty` → `specialties` |
| `src/features/public-booking/components/ServiceCard.tsx` | Modificar: remover exibição de preço |
| `src/features/public-booking/components/BookingSelectionBar.tsx` | Modificar: remover exibição de preço |

---

## Task 1: Schema Prisma + Migration

**Files:**
- Modify: `fashion-hair-backend/prisma/schema.prisma`
- Create: `fashion-hair-backend/prisma/migrations/<timestamp>_collaborator-rates-specialties/migration.sql`

**Interfaces:**
- Produces: `CollaboratorServiceRate` e `CollaboratorSpecialty` no Prisma Client para tasks subsequentes

---

- [ ] **Step 1: Atualizar schema.prisma**

Substitua toda a seção de modelos `CollaboratorProfile`, adicionando as duas novas tabelas e as novas relações em `User` e `Service`:

Em `prisma/schema.prisma`, localizar o bloco do modelo `CollaboratorProfile` (linha ~78) e substituir por:

```prisma
model CollaboratorProfile {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  bio       String?  @db.Text
  avatarUrl String?  @map("avatar_url") @db.VarChar(500)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user         User                   @relation(fields: [userId], references: [id])
  workingHours WorkingHours[]
  specialties  CollaboratorSpecialty[]

  @@map("collaborator_profiles")
}

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

Após o bloco `Service`, antes de `ClientServicePrice`, adicionar:

```prisma
model CollaboratorServiceRate {
  id                  String   @id @default(uuid())
  collaboratorId      String   @map("collaborator_id")
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

No modelo `User` (linha ~58), adicionar as relações na lista de relações existentes:

```prisma
  collaboratorRates    CollaboratorServiceRate[] @relation("CollaboratorRates")
  ratesUpdatedBy       CollaboratorServiceRate[] @relation("RateUpdatedBy")
```

No modelo `Service` (linha ~128), adicionar:

```prisma
  collaboratorRates CollaboratorServiceRate[]
```

- [ ] **Step 2: Gerar migration (somente arquivo)**

```bash
cd fashion-hair-backend
npx prisma migrate dev --create-only --name "collaborator-rates-and-specialties"
```

Isso cria um arquivo em `prisma/migrations/<timestamp>_collaborator-rates-and-specialties/migration.sql`.

- [ ] **Step 3: Editar a migration para preservar dados de specialty**

Abrir o `migration.sql` gerado. Localizar a linha:
```sql
ALTER TABLE "collaborator_profiles" DROP COLUMN "specialty";
```

Inserir **antes** dela o seguinte bloco:

```sql
-- DataMigration: copy existing single specialty into join table before dropping column
INSERT INTO "collaborator_specialties" ("id", "collaborator_profile_id", "specialty")
SELECT gen_random_uuid(), "id", "specialty"
FROM "collaborator_profiles"
WHERE "specialty" IS NOT NULL;
```

- [ ] **Step 4: Aplicar a migration**

```bash
npx prisma migrate dev
```

Saída esperada: `All migrations have been successfully applied.` e Prisma Client regenerado.

- [ ] **Step 5: Verificar no Prisma Studio**

```bash
npx prisma studio
```

Conferir: tabela `collaborator_service_rates` existe; tabela `collaborator_specialties` contém uma linha por colaborador que tinha `specialty` definida antes.

- [ ] **Step 6: Commit**

```bash
cd fashion-hair-backend
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add CollaboratorServiceRate + CollaboratorSpecialty (multi-specialty)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Rate Resolution Cascade (Backend)

**Files:**
- Modify: `src/shared/utils/salonFee.ts`
- Modify: `src/modules/cash-closing/cash-closing.service.ts` (apenas `buildBookingSnapshots`)
- Modify: `src/modules/appointments/appointments.service.ts` (3 chamadas)

**Interfaces:**
- Consumes: `CollaboratorServiceRate` (Task 1)
- Produces: `resolveSalonFeeRate(prisma, service, collaboratorId?)` com cascata CollaboratorServiceRate → Service → Global

---

- [ ] **Step 1: Atualizar `resolveSalonFeeRate` em `salonFee.ts`**

Substituir a função `resolveSalonFeeRate` (linhas 25-33 do arquivo atual):

```ts
/** Resolves effective salon fee % using cascade:
 *  CollaboratorServiceRate → Service.salonFeeRatePercent → SalonSetting.default
 */
export async function resolveSalonFeeRate(
  prisma: PrismaClient,
  service: Pick<Service, 'id' | 'salonFeeRatePercent'>,
  collaboratorId?: string,
): Promise<number> {
  if (collaboratorId) {
    const csr = await prisma.collaboratorServiceRate.findUnique({
      where: { collaboratorId_serviceId: { collaboratorId, serviceId: service.id } },
    });
    if (csr) return decimalToNumber(csr.salonFeeRatePercent);
  }
  if (service.salonFeeRatePercent != null) {
    return decimalToNumber(service.salonFeeRatePercent);
  }
  return getDefaultSalonFeeRate(prisma);
}
```

- [ ] **Step 2: Atualizar `buildBookingSnapshots` em `cash-closing.service.ts`**

Localizar a função `buildBookingSnapshots` (linha ~340). Adicionar `collaboratorId?` nas options e repassar para `resolveSalonFeeRate`:

```ts
export async function buildBookingSnapshots(
  prisma: PrismaClient,
  service: Pick<Service, 'id' | 'price' | 'salonFeeRatePercent'>,
  clientId: string,
  options?: {
    explicitPrice?: number | null;
    requestUserId?: string;
    standardPriceOnly?: boolean;
    collaboratorId?: string;
  },
) {
  const feeRate = await resolveSalonFeeRate(prisma, service, options?.collaboratorId);
  const standardPrice = decimalToNumber(service.price);
  const resolved =
    options?.standardPriceOnly && options.explicitPrice == null
      ? {
          price: standardPrice,
          standardPrice,
          source: 'standard' as const,
          isCustomPrice: false,
        }
      : await resolveAppointmentPrice(
          prisma,
          clientId,
          service,
          options?.explicitPrice,
        );

  return {
    priceAtBooking: resolved.price,
    standardPriceAtBooking: resolved.standardPrice,
    salonFeeRateAtBooking: feeRate,
    priceSetById: resolved.isCustomPrice ? options?.requestUserId ?? null : null,
    isCustomPrice: resolved.isCustomPrice,
  };
}
```

- [ ] **Step 3: Atualizar os 3 chamadores em `appointments.service.ts`**

**Chamada 1** — em `createAppointmentService` (~linha 192):
```ts
  const snapshots = await buildBookingSnapshots(prisma, service, clientId!, {
    explicitPrice: data.price,
    requestUserId: requestUserId,
    standardPriceOnly: data.price == null,
    collaboratorId: data.collaboratorId,
  });
```

**Chamada 2** — em `updateAppointmentService` (~linha 341):
```ts
    const snaps = await buildBookingSnapshots(prisma, newService, appointment.clientId, {
      explicitPrice: data.price,
      requestUserId,
      collaboratorId: appointment.collaboratorId,
    });
```

**Chamada 3** — em `updateStatusService` (~linha 421):
```ts
    const snaps = await buildBookingSnapshots(prisma, appointment.service, appointment.clientId, {
      explicitPrice: data.price,
      requestUserId,
      collaboratorId: appointment.collaboratorId,
    });
```

- [ ] **Step 4: Rodar o projeto para verificar que compila**

```bash
npx tsx src/app.ts
```

Esperado: servidor sobe sem erros de TypeScript. Pressionar Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/salonFee.ts src/modules/cash-closing/cash-closing.service.ts src/modules/appointments/appointments.service.ts
git commit -m "feat(rates): cascade CollaboratorServiceRate → Service → Global in resolveSalonFeeRate

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Collaborator Rate API (Backend)

**Files:**
- Modify: `src/modules/collaborators/collaborators.schema.ts`
- Modify: `src/modules/collaborators/collaborators.service.ts`
- Modify: `src/modules/collaborators/collaborators.routes.ts`
- Modify: `src/modules/collaborators/collaborators.controller.ts`

**Interfaces:**
- Consumes: `CollaboratorServiceRate` (Task 1), `resolveSalonFeeRate` (Task 2)
- Produces:
  - `GET /collaborators/:userId/service-rates` → `CollaboratorServiceRateItem[]`
  - `PUT /collaborators/:userId/service-rates` → `CollaboratorServiceRateItem[]`

---

- [ ] **Step 1: Adicionar schemas Zod em `collaborators.schema.ts`**

Adicionar ao final do arquivo:

```ts
export const serviceRateItemSchema = z.object({
  serviceId: z.string().uuid(),
  ratePercent: z.number().min(0).max(100).nullable(),
});

export const upsertServiceRatesSchema = z.object({
  rates: z.array(serviceRateItemSchema).min(1),
});

export type UpsertServiceRatesBody = z.infer<typeof upsertServiceRatesSchema>;
```

- [ ] **Step 2: Adicionar service functions em `collaborators.service.ts`**

Adicionar as imports necessárias no topo (se não existirem):

```ts
import { decimalToNumber, getDefaultSalonFeeRate, resolveSalonFeeRate } from '../../shared/utils/salonFee.js';
```

Adicionar as duas funções ao final do arquivo:

```ts
export async function listServiceRatesService(prisma: PrismaClient, collaboratorId: string) {
  const user = await prisma.user.findFirst({ where: { id: collaboratorId, deletedAt: null } });
  if (!user) throw new NotFoundError('Colaborador não encontrado');

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, durationMin: true, salonFeeRatePercent: true },
  });

  const configuredRates = await prisma.collaboratorServiceRate.findMany({
    where: { collaboratorId },
    select: { serviceId: true, salonFeeRatePercent: true },
  });

  const rateByServiceId = new Map(
    configuredRates.map((r) => [r.serviceId, decimalToNumber(r.salonFeeRatePercent)]),
  );

  const defaultRate = await getDefaultSalonFeeRate(prisma);

  return services.map((s) => {
    const configuredRate = rateByServiceId.get(s.id) ?? null;
    const effectiveRate =
      configuredRate ??
      (s.salonFeeRatePercent != null ? decimalToNumber(s.salonFeeRatePercent) : defaultRate);
    return {
      serviceId: s.id,
      serviceName: s.name,
      durationMin: s.durationMin,
      configuredRate,
      effectiveRate,
    };
  });
}

export async function upsertServiceRatesService(
  prisma: PrismaClient,
  collaboratorId: string,
  adminId: string,
  data: UpsertServiceRatesBody,
) {
  const user = await prisma.user.findFirst({ where: { id: collaboratorId, deletedAt: null } });
  if (!user) throw new NotFoundError('Colaborador não encontrado');

  await prisma.$transaction(async (tx) => {
    for (const item of data.rates) {
      if (item.ratePercent === null) {
        await tx.collaboratorServiceRate.deleteMany({
          where: { collaboratorId, serviceId: item.serviceId },
        });
      } else {
        await tx.collaboratorServiceRate.upsert({
          where: { collaboratorId_serviceId: { collaboratorId, serviceId: item.serviceId } },
          create: {
            collaboratorId,
            serviceId: item.serviceId,
            salonFeeRatePercent: item.ratePercent,
            updatedById: adminId,
          },
          update: {
            salonFeeRatePercent: item.ratePercent,
            updatedById: adminId,
          },
        });
      }
    }
  });

  return listServiceRatesService(prisma, collaboratorId);
}
```

Adicionar import do tipo no topo do arquivo:

```ts
import { UpsertServiceRatesBody } from './collaborators.schema.js';
```

- [ ] **Step 3: Adicionar controllers em `collaborators.controller.ts`**

Adicionar os imports:

```ts
import { upsertServiceRatesSchema } from './collaborators.schema.js';
import { listServiceRatesService, upsertServiceRatesService } from './collaborators.service.js';
```

Adicionar os dois handlers ao final:

```ts
export async function getServiceRatesController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  if (request.user.role !== 'ADMIN') throw new ForbiddenError();
  const result = await listServiceRatesService(request.server.prisma, request.params.id);
  return reply.status(200).send(result);
}

export async function upsertServiceRatesController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  if (request.user.role !== 'ADMIN') throw new ForbiddenError();
  const body = upsertServiceRatesSchema.parse(request.body);
  const result = await upsertServiceRatesService(
    request.server.prisma,
    request.params.id,
    request.user.sub,
    body,
  );
  return reply.status(200).send(result);
}
```

- [ ] **Step 4: Registrar as rotas em `collaborators.routes.ts`**

Adicionar o import dos novos controllers:

```ts
import {
  listCollaboratorsController,
  getCollaboratorController,
  upsertProfileController,
  upsertWorkingHoursController,
  getWorkingHoursController,
  getServiceRatesController,
  upsertServiceRatesController,
} from './collaborators.controller.js';
```

Adicionar as duas rotas antes do `}` de fechamento de `collaboratorsRoutes`:

```ts
  fastify.get<{ Params: { id: string } }>(
    '/:id/service-rates',
    { schema: { tags: ['Collaborators'], summary: 'Listar taxas por serviço (admin)', security: sec }, preHandler: [requireAuth, requireRole('ADMIN')] },
    getServiceRatesController,
  );
  fastify.put<{ Params: { id: string } }>(
    '/:id/service-rates',
    { schema: { tags: ['Collaborators'], summary: 'Salvar taxas por serviço (admin)', security: sec }, preHandler: [requireAuth, requireRole('ADMIN')] },
    upsertServiceRatesController,
  );
```

- [ ] **Step 5: Testar manualmente com curl**

Com o servidor rodando (`npm run dev`):

```bash
# Login como admin (ajustar senha se necessário)
TOKEN=$(curl -s -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fashionhair.com","password":"admin@123"}' | jq -r '.accessToken')

# Listar colaboradores para pegar um ID
COLLAB_ID=$(curl -s http://localhost:3333/api/v1/collaborators \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Listar taxas (devem todas retornar configuredRate: null inicialmente)
curl -s "http://localhost:3333/api/v1/collaborators/$COLLAB_ID/service-rates" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'

# Esperado: {"serviceId":"...","serviceName":"...","durationMin":...,"configuredRate":null,"effectiveRate":40}
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/collaborators/
git commit -m "feat(api): GET/PUT /collaborators/:id/service-rates para admin

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Multiple Specialties — Backend

**Files:**
- Modify: `src/shared/utils/serviceSpecialty.ts`
- Modify: `src/shared/utils/serviceSpecialty.test.ts`
- Modify: `src/modules/collaborators/collaborators.schema.ts`
- Modify: `src/modules/collaborators/collaborators.service.ts`
- Modify: `src/modules/dashboard/dashboard.service.ts`
- Modify: `src/modules/public-booking/public-booking.service.ts`

**Interfaces:**
- Consumes: `CollaboratorSpecialty` (Task 1)
- Produces: `collaboratorMatchesService(specialties: Specialty[], service)` aceita array; `upsertProfileService` grava em `CollaboratorSpecialty`; API retorna `specialties: Specialty[]`

---

- [ ] **Step 1: Atualizar `serviceSpecialty.ts` — aceitar array**

Substituir a função `collaboratorMatchesService`:

```ts
export function collaboratorMatchesService(
  collaboratorSpecialties: Specialty[] | null | undefined,
  service: ServiceLike,
): boolean {
  if (!collaboratorSpecialties || collaboratorSpecialties.length === 0) return false;
  const required = resolveServiceSpecialty(service);
  if (!required) return true;
  const allowed = COMPATIBLE_COLLABORATOR_SPECIALTIES[required];
  return collaboratorSpecialties.some((s) => allowed.includes(s));
}
```

- [ ] **Step 2: Atualizar testes em `serviceSpecialty.test.ts`**

Substituir o teste `'filters collaborators by compatible specialty'`:

```ts
  it('filters collaborators by compatible specialty (array)', () => {
    const manicure = { name: 'Manicure' };
    const pedicure = { name: 'Pedicure' };
    const corte = { name: 'Corte Masculino' };

    assert.equal(collaboratorMatchesService(['MANICURE'], manicure), true);
    assert.equal(collaboratorMatchesService(['HAIRDRESSER'], manicure), false);
    assert.equal(collaboratorMatchesService(['MANICURE', 'PEDICURE'], manicure), true);
    assert.equal(collaboratorMatchesService(['MANICURE'], pedicure), true);
    assert.equal(collaboratorMatchesService(['PEDICURE'], pedicure), true);
    assert.equal(collaboratorMatchesService(['HAIRDRESSER'], corte), true);
    assert.equal(collaboratorMatchesService(['MANICURE', 'PEDICURE'], corte), false);
    assert.equal(collaboratorMatchesService([], corte), false);
    assert.equal(collaboratorMatchesService(null, corte), false);
  });
```

- [ ] **Step 3: Rodar os testes**

```bash
npm test
```

Esperado: todos passam, incluindo o novo array-based.

- [ ] **Step 4: Atualizar `collaborators.schema.ts` — profile aceita `specialties[]`**

Substituir `upsertProfileSchema` e seus tipos:

```ts
export const upsertProfileSchema = z.object({
  specialties: z.array(z.nativeEnum(Specialty)).min(1, 'Selecione ao menos uma especialidade'),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpsertProfileBody = z.infer<typeof upsertProfileSchema>;
```

- [ ] **Step 5: Atualizar `collaborators.service.ts` — upsertProfileService e listCollaboratorsService**

Substituir `upsertProfileService`:

```ts
export async function upsertProfileService(
  prisma: PrismaClient,
  userId: string,
  data: UpsertProfileBody,
) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new NotFoundError('Usuário não encontrado');

  const profile = await prisma.collaboratorProfile.upsert({
    where: { userId },
    update: { bio: data.bio ?? null, avatarUrl: data.avatarUrl ?? null },
    create: { userId, bio: data.bio ?? null, avatarUrl: data.avatarUrl ?? null },
    select: { id: true, userId: true, bio: true, avatarUrl: true },
  });

  await prisma.$transaction([
    prisma.collaboratorSpecialty.deleteMany({ where: { collaboratorProfileId: profile.id } }),
    prisma.collaboratorSpecialty.createMany({
      data: data.specialties.map((specialty) => ({
        collaboratorProfileId: profile.id,
        specialty,
      })),
    }),
  ]);

  const specialties = await prisma.collaboratorSpecialty.findMany({
    where: { collaboratorProfileId: profile.id },
    select: { specialty: true },
    orderBy: { specialty: 'asc' },
  });

  return {
    id: profile.id,
    userId: profile.userId,
    specialties: specialties.map((s) => s.specialty),
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
  };
}
```

Substituir `listCollaboratorsService`:

```ts
export async function listCollaboratorsService(prisma: PrismaClient) {
  const users = await prisma.user.findMany({
    where: { role: 'COLLABORATOR', isActive: true, deletedAt: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      collaboratorProfile: {
        select: {
          id: true,
          specialties: { select: { specialty: true }, orderBy: { specialty: 'asc' } },
          bio: true,
          avatarUrl: true,
        },
      },
    },
  });

  return users.map((u) => ({
    ...u,
    collaboratorProfile: u.collaboratorProfile
      ? {
          ...u.collaboratorProfile,
          specialties: u.collaboratorProfile.specialties.map((s) => s.specialty),
        }
      : null,
  }));
}
```

Atualizar também `getCollaboratorService` para selecionar `specialties`:

```ts
export async function getCollaboratorService(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      collaboratorProfile: {
        select: {
          id: true,
          specialties: { select: { specialty: true }, orderBy: { specialty: 'asc' } },
          bio: true,
          avatarUrl: true,
          workingHours: { orderBy: { dayOfWeek: 'asc' } },
        },
      },
    },
  });
  if (!user) throw new NotFoundError('Colaborador não encontrado');

  return {
    ...user,
    collaboratorProfile: user.collaboratorProfile
      ? {
          ...user.collaboratorProfile,
          specialties: user.collaboratorProfile.specialties.map((s) => s.specialty),
        }
      : null,
  };
}
```

- [ ] **Step 6: Atualizar `dashboard.service.ts`**

Localizar a linha com `select: { specialty: true, avatarUrl: true }` (~linha 33) e substituir:

```ts
        select: {
          specialties: { select: { specialty: true }, orderBy: { specialty: 'asc' } },
          avatarUrl: true,
        },
```

No mesmo arquivo, após o `select`, mapear o resultado para achatar as especialidades. Localizar onde o resultado é retornado pelo dashboard e adicionar transformação:

```ts
// Dentro da função que retorna os dados do dashboard,
// transformar collaboratorProfile.specialties de [{specialty}] para Specialty[]
// A query já retorna o objeto; adicionar map no resultado final:
collaboratorProfile: c.collaboratorProfile
  ? {
      specialties: c.collaboratorProfile.specialties.map((s: { specialty: string }) => s.specialty),
      avatarUrl: c.collaboratorProfile.avatarUrl,
    }
  : null,
```

- [ ] **Step 7: Atualizar `public-booking.service.ts` — usar specialties[]**

Em `listPublicCollaboratorsService`, a query usa `listCollaboratorsService` que já retorna `specialties[]`. Atualizar o filtro e o map:

```ts
  return collaborators
    .filter((c) =>
      collaboratorMatchesService(c.collaboratorProfile?.specialties ?? [], service),
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      specialty: c.collaboratorProfile?.specialties[0] ?? null,
      bio: c.collaboratorProfile?.bio ?? null,
      avatarUrl: c.collaboratorProfile?.avatarUrl ?? null,
    }));
```

Em `createPublicAppointmentService`, a query de colaborador precisa incluir specialties. Substituir o `include`:

```ts
  const collaborator = await prisma.user.findFirst({
    where: { id: data.collaboratorId, deletedAt: null, isActive: true, role: 'COLLABORATOR' },
    include: {
      collaboratorProfile: {
        include: { specialties: true },
      },
    },
  });
```

E atualizar a verificação de compatibilidade logo abaixo:

```ts
  if (
    !collaboratorMatchesService(
      collaborator.collaboratorProfile?.specialties.map((s) => s.specialty) ?? [],
      service,
    )
  ) {
    throw new ValidationError('Este profissional não realiza o serviço selecionado');
  }
```

- [ ] **Step 8: Rodar testes e verificar compilação**

```bash
npm test
npx tsx src/app.ts
```

Esperado: todos os testes passam; servidor sobe sem erros TypeScript.

- [ ] **Step 9: Commit**

```bash
git add src/shared/utils/serviceSpecialty.ts src/shared/utils/serviceSpecialty.test.ts \
  src/modules/collaborators/ src/modules/dashboard/ src/modules/public-booking/
git commit -m "feat(specialties): multiple specialties per collaborator (CollaboratorSpecialty join table)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Public Booking Price Hiding (Backend)

**Files:**
- Modify: `src/modules/public-booking/public-booking.service.ts`

**Interfaces:**
- Produces: endpoint `GET /public/services` e resposta de `POST /public/appointments` sem campo `price`

---

- [ ] **Step 1: Remover `price` de `listPublicServicesService`**

Localizar (~linha 87):

```ts
export async function listPublicServicesService(prisma: PrismaClient) {
  const services = await listServicesService(prisma, true);
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    price: Number(s.price),       // ← remover esta linha
    specialty: resolveServiceSpecialty(s),
  }));
}
```

Resultado:

```ts
export async function listPublicServicesService(prisma: PrismaClient) {
  const services = await listServicesService(prisma, true);
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    specialty: resolveServiceSpecialty(s),
  }));
}
```

- [ ] **Step 2: Remover `price` da resposta de `createPublicAppointmentService`**

Localizar (~linha 262) o objeto retornado com `service: { id, name, durationMin, price }`:

```ts
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      durationMin: appointment.service.durationMin,
      price: Number(appointment.service.price),  // ← remover
    },
```

Resultado:

```ts
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      durationMin: appointment.service.durationMin,
    },
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsx src/app.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/public-booking/public-booking.service.ts
git commit -m "feat(public-booking): remove service price from public API responses

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Favicon de Tesoura Dourada

**Files:**
- Create: `fashion-hair-frontend/public/favicon.svg`
- Modify: `fashion-hair-frontend/index.html`

---

- [ ] **Step 1: Criar `public/favicon.svg`**

Criar arquivo `fashion-hair-frontend/public/favicon.svg` com o conteúdo:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="6" cy="6" r="3"/>
  <circle cx="6" cy="18" r="3"/>
  <line x1="20" y1="4" x2="8.12" y2="15.88"/>
  <line x1="14.47" y1="14.48" x2="20" y2="20"/>
  <line x1="8.12" y1="8.12" x2="12" y2="12"/>
</svg>
```

- [ ] **Step 2: Atualizar `index.html`**

Localizar a tag `<link rel="icon" ...>` existente (ou adicionar dentro de `<head>`).

Substituir/adicionar:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

Remover qualquer `<link rel="icon" href="/vite.svg" ...>` ou similar que possa existir.

- [ ] **Step 3: Verificar visualmente**

Abrir http://localhost:5173 no browser após `npm run dev`. Confirmar ícone de tesoura dourada na aba.

- [ ] **Step 4: Commit (no repositório do frontend)**

```bash
cd fashion-hair-frontend
git add public/favicon.svg index.html
git commit -m "feat(ui): favicon tesoura dourada (#C9A84C)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Frontend — Types e API Client

**Files:**
- Modify: `src/api/types.ts`
- Modify: `src/api/collaborators.ts`
- Modify: `src/api/publicBooking.ts`

**Interfaces:**
- Produces: `CollaboratorProfile.specialties: Specialty[]`; `CollaboratorServiceRateItem`; `upsertProfile({ specialties: Specialty[] })`; `getServiceRates`, `updateServiceRates`; `PublicService` sem `price`

---

- [ ] **Step 1: Atualizar `src/api/types.ts`**

Substituir `CollaboratorProfile`:

```ts
export interface CollaboratorProfile {
  id: string;
  specialties: Specialty[];
  bio: string | null;
  avatarUrl: string | null;
}
```

Substituir o campo `collaboratorProfile` em `User`:

```ts
  collaboratorProfile?: {
    specialties: Specialty[];
    avatarUrl: string | null;
  } | null;
```

Substituir o campo `collaboratorProfile` em `DailyDashboardResponse`:

```ts
    collaboratorProfile: { specialties: Specialty[]; avatarUrl: string | null } | null;
```

Adicionar a nova interface `CollaboratorServiceRateItem` após `CollaboratorProfile`:

```ts
export interface CollaboratorServiceRateItem {
  serviceId: string;
  serviceName: string;
  durationMin: number;
  configuredRate: number | null;
  effectiveRate: number;
}
```

- [ ] **Step 2: Atualizar `src/api/collaborators.ts`**

Substituir `upsertProfile`:

```ts
export async function upsertProfile(
  id: string,
  payload: { specialties: Specialty[]; bio?: string; avatarUrl?: string },
): Promise<unknown> {
  const { data } = await api.put(`/collaborators/${id}/profile`, payload);
  return data;
}
```

Adicionar as duas novas funções ao final:

```ts
export async function getServiceRates(id: string): Promise<CollaboratorServiceRateItem[]> {
  const { data } = await api.get<CollaboratorServiceRateItem[]>(`/collaborators/${id}/service-rates`);
  return data;
}

export async function updateServiceRates(
  id: string,
  rates: Array<{ serviceId: string; ratePercent: number | null }>,
): Promise<CollaboratorServiceRateItem[]> {
  const { data } = await api.put<CollaboratorServiceRateItem[]>(
    `/collaborators/${id}/service-rates`,
    { rates },
  );
  return data;
}
```

Adicionar `CollaboratorServiceRateItem` ao import de `types`:

```ts
import type { Collaborator, CollaboratorServiceRateItem, Specialty, WorkingHour, DayOfWeek } from './types';
```

- [ ] **Step 3: Atualizar `src/api/publicBooking.ts`**

Remover `price` de `PublicService`:

```ts
export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  specialty: Specialty | null;
};
```

Remover `price` do `service` em `PublicAppointmentResult`:

```ts
export type PublicAppointmentResult = {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  service: { id: string; name: string; durationMin: number };
  collaborator: { id: string; name: string };
  client: { name: string; email: string };
};
```

- [ ] **Step 4: Verificar compilação do frontend**

```bash
cd fashion-hair-frontend
npm run build
```

Erros de TypeScript são esperados neste passo (componentes ainda usam os tipos antigos). Anotar quais arquivos reportam erro e proceder com as tasks seguintes.

- [ ] **Step 5: Commit**

```bash
git add src/api/types.ts src/api/collaborators.ts src/api/publicBooking.ts
git commit -m "feat(types): specialties[], CollaboratorServiceRateItem, remove price from public API types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: ServiceRatesEditor — Novo Componente

**Files:**
- Create: `src/features/collaborators/ServiceRatesEditor.tsx`

**Interfaces:**
- Consumes: `getServiceRates(id)`, `updateServiceRates(id, rates)` (Task 7); `CollaboratorServiceRateItem` (Task 7)
- Produces: componente `<ServiceRatesEditor collaboratorId={string} />` para uso na Task 9

---

- [ ] **Step 1: Criar `ServiceRatesEditor.tsx`**

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getServiceRates, updateServiceRates } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CollaboratorServiceRateItem } from '@/api/types';

interface Props {
  collaboratorId: string;
}

export function ServiceRatesEditor({ collaboratorId }: Props) {
  const qc = useQueryClient();

  const { data: rates = [], isLoading } = useQuery({
    queryKey: collaboratorKeys.serviceRates(collaboratorId),
    queryFn: () => getServiceRates(collaboratorId),
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const payload = rates.map((r) => {
        const raw = drafts[r.serviceId];
        const parsed = raw !== undefined ? (raw.trim() === '' ? null : Number(raw)) : r.configuredRate;
        return { serviceId: r.serviceId, ratePercent: parsed };
      });
      return updateServiceRates(collaboratorId, payload);
    },
    onSuccess: () => {
      toast.success('Taxas salvas.');
      setDrafts({});
      qc.invalidateQueries({ queryKey: collaboratorKeys.serviceRates(collaboratorId) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar taxas')),
  });

  const effectiveDisplay = (r: CollaboratorServiceRateItem) => {
    const raw = drafts[r.serviceId];
    if (raw !== undefined) {
      const n = Number(raw);
      return raw.trim() === '' ? r.effectiveRate : (isNaN(n) ? r.effectiveRate : n);
    }
    return r.effectiveRate;
  };

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Carregando serviços…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Serviço</th>
              <th className="w-20 px-3 py-2 text-center">Min</th>
              <th className="w-32 px-3 py-2 text-center">Taxa (%)</th>
              <th className="w-24 px-3 py-2 text-center">Efetiva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rates.map((r) => (
              <tr key={r.serviceId}>
                <td className="px-3 py-2 font-medium">{r.serviceName}</td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {r.durationMin}
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="—"
                    value={drafts[r.serviceId] ?? (r.configuredRate !== null ? String(r.configuredRate) : '')}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [r.serviceId]: e.target.value }))
                    }
                    className="h-7 w-full text-center text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                  {effectiveDisplay(r).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Campo vazio = usa taxa do serviço ou global.
        </p>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || Object.keys(drafts).length === 0}
        >
          {mutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Salvar taxas
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar `serviceRates` ao query key builder**

Em `src/lib/queryKeys.ts`, localizar `collaboratorKeys` e adicionar:

```ts
serviceRates: (id: string) => [...collaboratorKeys.detail(id), 'service-rates'] as const,
```

- [ ] **Step 3: Commit**

```bash
git add src/features/collaborators/ServiceRatesEditor.tsx src/lib/queryKeys.ts
git commit -m "feat(ui): ServiceRatesEditor — taxa por serviço editável por colaborador

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: CollaboratorProfileDialog (Multi-Select) + CollaboratorsPage

**Files:**
- Modify: `src/features/collaborators/CollaboratorProfileDialog.tsx`
- Modify: `src/features/collaborators/CollaboratorsPage.tsx`
- Modify: `src/features/dashboard/CollaboratorAccordionCard.tsx`
- Modify: `src/features/dashboard/SalonDisplayPage.tsx`

**Interfaces:**
- Consumes: `ServiceRatesEditor` (Task 8); tipos com `specialties[]` (Task 7)

---

- [ ] **Step 1: Atualizar `CollaboratorProfileDialog.tsx` — multi-select de especialidades**

Substituir o arquivo inteiro:

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { upsertProfile } from '@/api/collaborators';
import { getApiErrorMessage } from '@/api/client';
import { collaboratorKeys } from '@/lib/queryKeys';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
import type { Collaborator, Specialty } from '@/api/types';

const ALL_SPECIALTIES: Specialty[] = [
  'HAIRDRESSER',
  'MANICURE',
  'PEDICURE',
  'MAKEUP_ARTIST',
  'EYEBROW',
  'AESTHETICIAN',
];

const schema = z.object({
  specialties: z.array(z.enum([
    'HAIRDRESSER', 'MANICURE', 'PEDICURE', 'MAKEUP_ARTIST', 'EYEBROW', 'AESTHETICIAN',
  ] as const)).min(1, 'Selecione ao menos uma especialidade'),
  bio: z.string().max(500).optional().or(z.literal('')),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator;
}

export function CollaboratorProfileDialog({ open, onOpenChange, collaborator }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { specialties: ['HAIRDRESSER'], bio: '', avatarUrl: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        specialties:
          collaborator.collaboratorProfile?.specialties.length
            ? collaborator.collaboratorProfile.specialties
            : ['HAIRDRESSER'],
        bio: collaborator.collaboratorProfile?.bio ?? '',
        avatarUrl: collaborator.collaboratorProfile?.avatarUrl ?? '',
      });
    }
  }, [open, collaborator, reset]);

  const selectedSpecialties = watch('specialties');

  const toggleSpecialty = (s: Specialty) => {
    if (selectedSpecialties.includes(s)) {
      setValue(
        'specialties',
        selectedSpecialties.filter((x) => x !== s),
        { shouldValidate: true },
      );
    } else {
      setValue('specialties', [...selectedSpecialties, s], { shouldValidate: true });
    }
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertProfile(collaborator.id, {
        specialties: values.specialties,
        bio: values.bio?.trim() ? values.bio.trim() : undefined,
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Perfil atualizado.');
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
      qc.invalidateQueries({ queryKey: collaboratorKeys.detail(collaborator.id) });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar perfil')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perfil do colaborador</DialogTitle>
          <DialogDescription>{collaborator.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SPECIALTIES.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedSpecialties.includes(s)}
                    onCheckedChange={() => toggleSpecialty(s)}
                  />
                  <span className="text-sm">{SPECIALTY_LABELS[s]}</span>
                </label>
              ))}
            </div>
            {errors.specialties ? (
              <p className="text-xs text-destructive">{errors.specialties.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">URL do avatar (opcional)</Label>
            <Input id="avatar" placeholder="https://..." {...register('avatarUrl')} />
            {errors.avatarUrl ? (
              <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (opcional)</Label>
            <Textarea id="bio" rows={3} {...register('bio')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Integrar `ServiceRatesEditor` em `CollaboratorsPage.tsx`**

Adicionar import:

```tsx
import { ServiceRatesEditor } from './ServiceRatesEditor';
```

Adicionar state para controlar qual seção de taxas está aberta. Após `const [hoursOpenFor, setHoursOpenFor] = useState<string | null>(null);`, adicionar:

```tsx
const [ratesOpenFor, setRatesOpenFor] = useState<string | null>(null);
```

Dentro do card de cada colaborador (no bloco `{canEdit(c.id) ? ... : null}`), após o bloco de horários (`WorkingHoursEditor`), adicionar o bloco de taxas (apenas para admin):

```tsx
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
```

Adicionar `Wallet` ao import de lucide-react se não existir:

```tsx
import { CalendarClock, Pencil, UserCog, Wallet } from 'lucide-react';
```

- [ ] **Step 3: Atualizar `CollaboratorAccordionCard.tsx` — aceitar specialties[]**

Substituir a interface de props e a exibição:

```tsx
interface CollaboratorAccordionCardProps {
  name: string;
  specialties: Specialty[];
  appointments: Appointment[];
  defaultOpen?: boolean;
}
```

Adicionar import:

```tsx
import type { Appointment, Specialty } from '@/api/types';
import { SPECIALTY_LABELS } from '@/lib/enumLabels';
```

Substituir a linha que exibe a especialidade:

```tsx
          <span className="block text-xs text-muted-foreground">
            {specialties.length > 0
              ? specialties.map((s) => SPECIALTY_LABELS[s]).join(' · ')
              : 'Colaborador'}
          </span>
```

- [ ] **Step 4: Atualizar `SalonDisplayPage.tsx`**

Localizar onde `CollaboratorAccordionCard` é instanciado e substituir `specialty={collab.collaboratorProfile?.specialty ?? null}` por:

```tsx
specialties={collab.collaboratorProfile?.specialties ?? []}
```

- [ ] **Step 5: Compilar e testar visualmente**

```bash
npm run build
```

Esperado: zero erros. Em seguida:

```bash
npm run dev
```

Abrir http://localhost:5173, logar como admin, ir a Colaboradores. Verificar:
- Card de colaborador mostra checkboxes no dialog de edição de perfil
- Seção "Taxas por serviço" aparece para admin abaixo dos horários
- Salvar taxas grava no backend e re-exibe os valores

- [ ] **Step 6: Commit**

```bash
git add src/features/collaborators/ src/features/dashboard/CollaboratorAccordionCard.tsx \
  src/features/dashboard/SalonDisplayPage.tsx
git commit -m "feat(ui): multi-select especialidades + ServiceRatesEditor no card de colaborador

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Public Booking — Remover Preço da UI

**Files:**
- Modify: `src/features/public-booking/components/ServiceCard.tsx`
- Modify: `src/features/public-booking/components/BookingSelectionBar.tsx`

**Interfaces:**
- Consumes: `PublicService` sem `price` (Task 7)

---

- [ ] **Step 1: Atualizar `ServiceCard.tsx`**

Remover a importação de `formatCurrency` e a exibição de preço.

Substituir a linha:
```tsx
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {service.durationMin} min · {formatCurrency(service.price)}
            </p>
```

Por:
```tsx
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {service.durationMin} min
            </p>
```

Remover o import de `formatCurrency` se não usado em mais nenhum lugar do arquivo:
```tsx
import { Clock, ChevronRight } from 'lucide-react';
```

- [ ] **Step 2: Atualizar `BookingSelectionBar.tsx`**

Substituir a linha:
```tsx
          {service.durationMin} min · {formatCurrency(service.price)}
```

Por:
```tsx
          {service.durationMin} min
```

Remover import de `formatCurrency` se não usado mais:
```tsx
import { ArrowLeft, Clock } from 'lucide-react';
```

- [ ] **Step 3: Build final e validação**

```bash
npm run build
```

Esperado: zero erros TypeScript.

Abrir o fluxo de booking público em http://localhost:5173/agendar (ou rota equivalente). Verificar que nenhum preço é exibido nos cards de serviço.

- [ ] **Step 4: Commit final**

```bash
git add src/features/public-booking/components/ServiceCard.tsx \
  src/features/public-booking/components/BookingSelectionBar.tsx
git commit -m "feat(public-booking): remove price display from service selection UI

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review do Plano

### Cobertura do spec

| Requisito do spec | Task que implementa |
|---|---|
| `CollaboratorServiceRate` schema | Task 1 |
| `CollaboratorSpecialty` schema + data migration | Task 1 |
| Cascata CollaboratorServiceRate → Service → Global | Task 2 |
| `buildBookingSnapshots` passa `collaboratorId` | Task 2 |
| API GET/PUT `/collaborators/:id/service-rates` | Task 3 |
| `upsertProfileService` grava em `CollaboratorSpecialty` | Task 4 |
| `collaboratorMatchesService` aceita array | Task 4 |
| Dashboard + public-booking usam `specialties[]` | Task 4 |
| Backend remove `price` das respostas públicas | Task 5 |
| Favicon tesoura dourada | Task 6 |
| `types.ts` e API client atualizados | Task 7 |
| `ServiceRatesEditor` component | Task 8 |
| `CollaboratorProfileDialog` multi-select | Task 9 |
| `ServiceRatesEditor` integrado em `CollaboratorsPage` | Task 9 |
| `CollaboratorAccordionCard` aceita `specialties[]` | Task 9 |
| `ServiceCard` / `BookingSelectionBar` sem preço | Task 10 |

### Consistência de tipos

- `resolveSalonFeeRate(prisma, service, collaboratorId?)`: `service` agora é `Pick<Service, 'id' | 'salonFeeRatePercent'>` — todos os call sites já passavam `service` com `id` presente.
- `collaboratorMatchesService(specialties: Specialty[], service)`: todos os call sites em `public-booking.service.ts` atualizados na Task 4 para passar `.map(s => s.specialty)`.
- `CollaboratorServiceRateItem` definido em `types.ts` (Task 7) e importado em `collaborators.ts` (Task 7) e `ServiceRatesEditor.tsx` (Task 8).
- `collaboratorKeys.serviceRates(id)` adicionado em `queryKeys.ts` (Task 8) antes de ser usado no editor.
