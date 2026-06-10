# fn-29-feat-035-creator-network-discovery.3 — DiscoveryGrid + useDiscoveryCreatorsInfiniteQuery

## Description

Implementar el hook de query infinite y el componente grid que renderiza los creator cards (placeholder por ahora). El grid muestra skeleton mientras carga, contador `N creadores encontrados` con `total` del primer page, scroll infinito con botón "Cargar más", empty state y error state.

**Size:** M

## Hook: `src/features/discovery/network/hooks/useDiscoveryCreatorsInfiniteQuery.ts`

`getDiscoveryCreators` es un query normal (no infinite) en el cliente generado. Hay que usar `useInfiniteQuery` manualmente:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

import { getDiscoveryCreators } from '#/shared/api/generated/brand/brand'
import type {
  DiscoveryCreatorsResponse,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'

const PAGE_LIMIT = 24

export function getDiscoveryCreatorsQueryKey(params: Omit<GetDiscoveryCreatorsParams, 'cursor'>) {
  return ['discovery', 'creators', params] as const
}

export function useDiscoveryCreatorsInfiniteQuery(
  params: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>,
) {
  return useInfiniteQuery({
    queryKey: getDiscoveryCreatorsQueryKey(params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await getDiscoveryCreators(
        {
          ...params,
          limit: PAGE_LIMIT,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Discovery creators query failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: DiscoveryCreatorsResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}
```

## Componente: `src/features/discovery/network/components/DiscoveryGrid.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { ChevronDown, Loader2, Search } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { DiscoveryCreatorCard, GetDiscoveryCreatorsParams } from '#/shared/api/generated/model'

import { useDiscoveryCreatorsInfiniteQuery } from '../hooks/useDiscoveryCreatorsInfiniteQuery'

interface DiscoveryGridProps {
  params: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>
  // Render prop para la card — implementado en task .6
  renderCard: (card: DiscoveryCreatorCard) => React.ReactNode
}

export function DiscoveryGrid({ params, renderCard }: DiscoveryGridProps) {
  const query = useDiscoveryCreatorsInfiniteQuery(params)

  const allCards = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  if (query.isPending) {
    return <DiscoveryGridSkeleton />
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t`No pudimos cargar la lista de creators. Intentá de nuevo.`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
          {t`Reintentar`}
        </Button>
      </div>
    )
  }

  if (allCards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Search className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t`No encontramos creators con esos filtros`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Probá ajustar o limpiar los filtros.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t`${total} creadores encontrados`}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allCards.map((card) => (
          <React.Fragment key={card.account_id}>
            {renderCard(card)}
          </React.Fragment>
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

function DiscoveryGridSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label={t`Cargando creators`}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="h-64 rounded-2xl border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  )
}
```

## Integrar en la ruta

Actualizar `src/routes/_brand/discovery.tsx` para:
1. Leer `appliedFilters` y `activeSort` del store.
2. Sincronizar URL → store al montar usando `useEffect` (si hay filtros en URL, inicializar `appliedFilters`).
3. Pasar `{ ...appliedFilters, sort: activeSort }` como `params` al `DiscoveryGrid`.
4. Reemplazar el placeholder div por `<DiscoveryGrid params={...} renderCard={(card) => <div key={card.account_id}>{card.display_name}</div>} />` (placeholder hasta task .6).

```tsx
// En DiscoveryRoute:
const search = Route.useSearch()
const navigate = useNavigate({ from: '/discovery' })
const { appliedFilters, activeSort, setSort } = useDiscoveryFiltersStore()

// Sync URL → store al montar
useEffect(() => {
  const { sort, ...filters } = search
  useDiscoveryFiltersStore.setState({ appliedFilters: filters, activeSort: sort ?? 'recommended' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // solo al montar

// Sync store → URL cuando cambia appliedFilters
useEffect(() => {
  void navigate({
    search: () => ({ ...appliedFilters, sort: activeSort }),
    replace: true,
  })
}, [appliedFilters, activeSort, navigate])
```

Nota: El `useEffect` de sync URL → store al montar usa el array vacío `[]` intencionalmente (solo al montar). Agregar un comentario eslint-disable si el linter lo requiere.

## Acceptance

- [ ] Navegar a `/discovery` muestra el grid con creators reales del backend.
- [ ] Skeleton visible durante la carga.
- [ ] Contador `N creadores encontrados` muestra `total` del primer page.
- [ ] Botón "Cargar más" funciona y carga la siguiente página.
- [ ] Error state tiene botón "Reintentar".
- [ ] Empty state aparece cuando `items.length === 0`.
- [ ] Cambiar los filtros aplicados recarga el grid desde el principio (nueva query key).
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: