import { t } from '@lingui/core/macro'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import type {
  DiscoveryCreatorCard,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'

import { useDiscoveryCreatorsInfiniteQuery } from '../hooks/useDiscoveryCreatorsInfiniteQuery'

interface DiscoveryGridProps {
  params: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>
  renderCard: (card: DiscoveryCreatorCard) => ReactNode
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
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
          <Fragment key={card.account_id}>{renderCard(card)}</Fragment>
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
          className="h-64 animate-pulse rounded-2xl border border-border bg-card"
        />
      ))}
    </div>
  )
}
