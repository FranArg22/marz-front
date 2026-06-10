# fn-29-feat-035-creator-network-discovery.2 — Ruta /discovery + estructura de feature + discoveryFiltersStore

## Description

Crear la ruta `/_brand/discovery` con validación de filtros en URL (solo `appliedFilters`) y el store Zustand `discoveryFiltersStore` que mantiene `pendingFilters` (lo que el usuario está editando en el panel) y `appliedFilters` (lo que está en la URL / se usa para el query). El componente de ruta renderiza un shell con placeholders de grid, panel y chips.

**Size:** S

## Archivos nuevos

### `src/features/discovery/network/store/discoveryFiltersStore.ts`

```ts
import { create } from 'zustand'
import type { GetDiscoveryCreatorsParams } from '#/shared/api/generated/model'

export type DiscoveryFilters = Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit' | 'sort'>

type DiscoveryFiltersStore = {
  pendingFilters: DiscoveryFilters
  appliedFilters: DiscoveryFilters
  activeSort: GetDiscoveryCreatorsParams['sort']
  setPendingFilters: (filters: DiscoveryFilters) => void
  applyFilters: () => void
  resetPendingFilters: () => void
  clearFilters: () => void
  setSort: (sort: GetDiscoveryCreatorsParams['sort']) => void
}

const EMPTY_FILTERS: DiscoveryFilters = {}

export const useDiscoveryFiltersStore = create<DiscoveryFiltersStore>()((set, get) => ({
  pendingFilters: EMPTY_FILTERS,
  appliedFilters: EMPTY_FILTERS,
  activeSort: 'recommended',
  setPendingFilters: (filters) => set({ pendingFilters: filters }),
  applyFilters: () => set((state) => ({ appliedFilters: state.pendingFilters })),
  resetPendingFilters: () => set((state) => ({ pendingFilters: state.appliedFilters })),
  clearFilters: () => set({ pendingFilters: EMPTY_FILTERS, appliedFilters: EMPTY_FILTERS }),
  setSort: (sort) => set({ activeSort: sort }),
}))

export function countActiveFilters(filters: DiscoveryFilters): number {
  return Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '',
  ).length
}
```

### `src/routes/_brand/discovery.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { Compass } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  GetDiscoveryCreatorsGender,
  GetDiscoveryCreatorsSort,
  SocialPlatform,
} from '#/shared/api/generated/model'

// Solo los filtros APLICADOS van en la URL. Los pendientes viven en el store.
const discoverySearchSchema = z.object({
  platforms: z.array(z.enum(SocialPlatform)).optional().catch(undefined),
  countries: z.array(z.string()).optional().catch(undefined),
  gender: z.enum(GetDiscoveryCreatorsGender).optional().catch(undefined),
  age_buckets: z.array(z.enum(GetDiscoveryCreatorsAgeBucketsItem)).optional().catch(undefined),
  interests: z.array(z.string()).optional().catch(undefined),
  content_types: z.array(z.string()).optional().catch(undefined),
  followers_min: z.number().int().optional().catch(undefined),
  followers_max: z.number().int().optional().catch(undefined),
  engagement_rate_min: z.number().optional().catch(undefined),
  avg_views_min: z.number().int().optional().catch(undefined),
  avg_views_max: z.number().int().optional().catch(undefined),
  cpm_min: z.string().optional().catch(undefined),
  cpm_max: z.string().optional().catch(undefined),
  price_min: z.string().optional().catch(undefined),
  price_max: z.string().optional().catch(undefined),
  sort: z.enum(GetDiscoveryCreatorsSort).optional().catch(undefined),
})

export type DiscoverySearch = z.infer<typeof discoverySearchSchema>

export const Route = createFileRoute('/_brand/discovery')({
  validateSearch: (search) => discoverySearchSchema.parse(search),
  component: DiscoveryRoute,
})

function DiscoveryRoute() {
  useRouteTopbar({ breadcrumb: [{ icon: Compass, label: t`Discovery` }] })

  // Sincronizar URL → store al montar (si el user llega con filtros en URL)
  // Se implementa en task .3 cuando el store se conecta al grid.
  // Por ahora: shell vacío.
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {t`Discovery`}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {t`Explorá la red de creators`}
        </h2>
      </div>
      {/* Chips placeholder — implementado en task .5 */}
      {/* Grid placeholder — implementado en task .3 */}
      <div className="flex-1 rounded-2xl border border-dashed border-border bg-card" />
    </div>
  )
}
```

## Estructura de carpetas

Crear (vacías o con index placeholder):

```
src/features/discovery/network/
src/features/discovery/network/store/
src/features/discovery/network/components/
src/features/discovery/network/hooks/
```

El store va en `store/discoveryFiltersStore.ts`. Los componentes del grid, panel, card, etc., van en `components/`. Los hooks de query y mutation van en `hooks/`.

## Nota sobre enums

`SocialPlatform`, `GetDiscoveryCreatorsGender`, `GetDiscoveryCreatorsAgeBucketsItem`, `GetDiscoveryCreatorsSort` son constantes de objeto (no arrays), por lo que `z.enum()` requiere pasarlos como `[...Object.values(Enum)]`. Si TypeScript rechaza esto, usar `z.nativeEnum(Enum)` en su lugar.

Ejemplo:
```ts
gender: z.enum(Object.values(GetDiscoveryCreatorsGender) as [string, ...string[]]).optional().catch(undefined)
```

Verificar con `pnpm typecheck` después de escribir el schema.

## Acceptance

- [ ] Navegar a `/discovery` no da 404 y renderiza el topbar con breadcrumb "Discovery".
- [ ] `pnpm typecheck` verde.
- [ ] `discoveryFiltersStore` exporta `useDiscoveryFiltersStore` y `countActiveFilters`.
- [ ] El schema Zod de la ruta parsea sin errores filtros vacíos y filtros con valores.
- [ ] La carpeta `src/features/discovery/network/{store,components,hooks}/` existe.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: