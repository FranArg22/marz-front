# fn-29-feat-035-creator-network-discovery.1 — Commit api:sync + eliminar Discovery tab de campaña + crear tab Postulaciones

## Description

Esta task es la primera porque el diff de `pnpm api:sync` está en el working tree sin commitear y el código existente referencia 5 funciones que ya no existen en el cliente generado, rompiendo el build.

**Size:** M

## Archivos del api:sync a commitear

El working tree ya tiene estos cambios (verificar con `git status`). Agregar todos los archivos de `src/shared/api/generated/`, `openapi/spec.json`, y `src/shared/api/generated/zod/` al stage y commitear.

Mensaje de commit sugerido: `chore: api:sync FEAT-035 — drop campaign-scoped discovery, add network discovery endpoints`

## Código roto que hay que arreglar

Los siguientes archivos en `src/features/discovery/campaign-detail/` importan funciones que ya no existen:

### `src/features/discovery/campaign-detail/queries.ts`

Importa (todas eliminadas del cliente):
- `getCampaignDiscoverySummary`
- `listCampaignDiscoveryActive`
- `listCampaignDiscoveryApplications`
- `listCampaignDiscoveryInvites`
- `listCampaignDiscoveryMatches`
- Tipos importados ya eliminados: `CampaignActiveListResponse`, `CampaignApplicationListResponse` (old path), `CampaignDiscoverySummaryResponse`, `CampaignInviteListResponse`, `CampaignMatchListResponse`, `ListCampaignDiscoveryActiveParams`, `ListCampaignDiscoveryApplicationsParams`, `ListCampaignDiscoveryInvitesParams`, `ListCampaignDiscoveryMatchesParams`, `ListCampaignDiscoveryMatchesSort`

**Acción**: reemplazar el archivo entero con una versión mínima que solo tenga la query de applications usando el nuevo endpoint `listCampaignApplications` de `campaigns.ts`. Eliminar todo lo relacionado a matches, invites, active, summary.

```ts
// Archivo resultante mínimo: src/features/discovery/campaign-detail/queries.ts
import { useInfiniteQuery } from '@tanstack/react-query'

import { listCampaignApplications } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignApplicationListResponse,
  ListCampaignApplicationsParams,
} from '#/shared/api/generated/model'

const DEFAULT_LIMIT = 12

export function getCampaignApplicationsQueryKey(
  campaignId: string,
  params?: Record<string, unknown>,
) {
  return ['campaign', campaignId, 'applications', params ?? {}] as const
}

export function useCampaignApplicationsQuery(campaignId: string) {
  const params = {
    limit: DEFAULT_LIMIT,
  } satisfies ListCampaignApplicationsParams

  return useInfiniteQuery({
    queryKey: getCampaignApplicationsQueryKey(campaignId, params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignApplications(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign applications failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignApplicationListResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}
```

### `src/features/discovery/campaign-detail/mutations.ts`

Importa (eliminadas):
- `contactCampaignDiscoveryMatch` → eliminar `useContactMatch` y todo su código
- `createCampaignDiscoveryInvite` → eliminar `useCreateCampaignInvite` y todo su código
- `ContactCampaignMatchRequest`, `CreateCampaignInviteRequest` → eliminar imports
- `trackDiscoveryMatchContacted`, `trackDiscoveryInviteCreated` → eliminar imports
- `matchesCreatorsQueryForCampaign` → eliminar si no queda ningún uso

Quedan: `acceptCampaignDiscoveryApplication`, `rejectCampaignDiscoveryApplication` (siguen existiendo en `campaigns.ts`).

**Acción**: reescribir el archivo conservando solo `useAcceptApplication` y `useRejectApplication` + el helper `handleDiscoveryMutationError` mínimo (solo los códigos de error relevantes al accept/reject).

### `src/features/discovery/campaign-detail/DiscoveryTab.tsx`

Este archivo usa todas las queries y mutations eliminadas. Reemplazar con un componente `ApplicationsTab` que use `useCampaignApplicationsQuery`.

**Archivo nuevo**: `src/features/discovery/campaign-detail/ApplicationsTab.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'

import { ApplicationCard } from './ApplicationCard'
import { useCampaignApplicationsQuery } from './queries'

interface ApplicationsTabProps {
  campaignId: string
}

export function ApplicationsTab({ campaignId }: ApplicationsTabProps) {
  const query = useCampaignApplicationsQuery(campaignId)
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const count = items.length

  if (query.isPending) {
    return (
      <div role="status" aria-label={t`Cargando postulaciones`} className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t`Cargando postulaciones...`}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t`No pudimos cargar las postulaciones. Reintentá en unos minutos.`}
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-semibold text-foreground">{t`Todavía no hay postulaciones`}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Las postulaciones entrantes van a aparecer acá.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t`Postulaciones`}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`${count} postulaciones recibidas`}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((application) => (
          <ApplicationCard
            key={application.application_id}
            campaignId={campaignId}
            application={application}
          />
        ))}
      </div>
      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden />
            )}
            {t`Cargar más`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
```

**Eliminar**: `DiscoveryTab.tsx`, `DiscoverySidebar.tsx`, `MatchCard.tsx`, `InviteList.tsx`, `AddCreatorDialog.tsx`, `queries.test.ts` (reemplazar con test vacío o stub si existen tests de applications), `mutations.test.tsx` (actualizar para que solo cubra accept/reject application).

## Cambios en campaign detail

### `src/features/campaigns/detail/CampaignDetailTabs.tsx`

Reemplazar el tab `discovery` por `applications`:

```ts
// getCampaignDetailTabs() — reemplazar la entrada 'discovery'
{ id: 'applications', label: t`Postulaciones`, icon: ClipboardList },
```

Actualizar el tipo: `'applications'` en lugar de `'discovery'`.
Actualizar `isCampaignDetailNavigableTab` para incluir `'applications'` y excluir `'discovery'`.

### `src/features/campaigns/detail/CampaignDetailPage.tsx`

- Eliminar import de `DiscoveryTab`
- Agregar import de `ApplicationsTab` desde `#/features/discovery/campaign-detail/ApplicationsTab`
- Eliminar import de `trackDiscoverySectionViewed` y el `useEffect` que la llama
- Eliminar del tipo `CampaignDetailSearch` el campo `section` (o dejarlo como string opcional si hay otras referencias)
- Reemplazar el bloque `if (tab === 'discovery')` por `if (tab === 'applications') { return <ApplicationsTab campaignId={campaignId} /> }`

### `src/routes/_brand/campaigns.$campaignId.tsx`

Actualizar `campaignDetailTabSchema` para reemplazar `'discovery'` por `'applications'`.
Remover `campaignDetailSectionSchema` si ya no es necesario (solo era para el discovery section).
Verificar qué campos del `campaignDetailSearchSchema` son aún necesarios.

### `src/features/campaigns/detail/CampaignDetailHeader.tsx`

Verificar si usa `allows_in_platform_invites` u otro capability relacionado a discovery y limpiar si corresponde.

## Archivos a eliminar

```
src/features/discovery/campaign-detail/DiscoveryTab.tsx
src/features/discovery/campaign-detail/DiscoverySidebar.tsx
src/features/discovery/campaign-detail/MatchCard.tsx
src/features/discovery/campaign-detail/InviteList.tsx
src/features/discovery/campaign-detail/AddCreatorDialog.tsx
src/features/discovery/campaign-detail/utils.ts          (si solo servía a los archivos eliminados)
src/shared/analytics/discoveryTracking.ts                (si solo tenía trackDiscovery* del campaign-scoped)
```

Verificar antes de borrar que no hay imports en otro lugar. Si algún archivo tiene imports externos que siguen necesarios, dejarlo y limpiar solo lo campaign-scoped.

## Acceptance

- [ ] `pnpm typecheck` verde (sin errores de imports eliminados).
- [ ] `pnpm test` verde excepto failures pre-existentes conocidos (deliverables/*, topbar-routes.test.tsx).
- [ ] El tab "Postulaciones" aparece en campaign detail (reemplaza "Discovery").
- [ ] El tab "Postulaciones" renderiza applications usando `listCampaignApplications` (nuevo endpoint).
- [ ] Accept/Reject de applications siguen funcionando desde el `ApplicationCard`.
- [ ] Smoke manual: abrir campaign detail → ver tab Postulaciones → ver listado o empty state.
- [ ] No quedan imports de `listCampaignDiscoveryMatches`, `listCampaignDiscoveryInvites`, `listCampaignDiscoveryActive`, `getCampaignDiscoverySummary`, `listCampaignDiscoveryApplications` (función vieja) en src/.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: