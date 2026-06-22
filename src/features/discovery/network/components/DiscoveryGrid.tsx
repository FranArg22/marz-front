import { t } from '@lingui/core/macro'
import { ChevronDown, Loader2, Search, Send } from 'lucide-react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type {
  DiscoveryCreatorCard,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'
import { GetDiscoveryCreatorsSort } from '#/shared/api/generated/model'

import { useDiscoveryCreatorsInfiniteQuery } from '../hooks/useDiscoveryCreatorsInfiniteQuery'
import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'

interface DiscoveryGridProps {
  params: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>
  renderCard: (card: DiscoveryCreatorCard) => ReactNode
  onBulkInvite: () => void
}

export function DiscoveryGrid({
  params,
  renderCard,
  onBulkInvite,
}: DiscoveryGridProps) {
  const query = useDiscoveryCreatorsInfiniteQuery(params)
  const {
    activeSort,
    setSort,
    selectionMode,
    toggleSelectionMode,
    selectedAccountIds,
  } = useDiscoveryFiltersStore()

  const allCards = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const selectedCount = selectedAccountIds.size

  if (query.isPending) {
    return <DiscoveryGridSkeleton />
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {t`No pudimos cargar la lista de creadores. Intentá de nuevo.`}
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
          {t`No encontramos creadores con esos filtros`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Probá ajustar o limpiar los filtros.`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={selectionMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={toggleSelectionMode}
          >
            {selectionMode ? t`Cancelar selección` : t`Seleccionar`}
          </Button>
          {selectionMode ? (
            <Button
              type="button"
              size="sm"
              disabled={selectedCount === 0}
              onClick={onBulkInvite}
            >
              <Send className="size-3.5" aria-hidden />
              {selectedCount > 0 ? t`Invitar (${selectedCount})` : t`Invitar`}
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {t`${total} creadores encontrados`}
          </p>
          <Select
            value={activeSort}
            onValueChange={(value) =>
              setSort(value as GetDiscoveryCreatorsParams['sort'])
            }
          >
            <SelectTrigger size="sm" className="w-auto gap-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GetDiscoveryCreatorsSort.reach_desc}>
                {t`Mayor alcance`}
              </SelectItem>
              <SelectItem value={GetDiscoveryCreatorsSort.er_desc}>
                {t`Mayor ER`}
              </SelectItem>
              <SelectItem value={GetDiscoveryCreatorsSort.price_asc}>
                {t`Menor precio`}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* -m-3 p-3: aire interno para que el ring de selección (2px) y la sombra
          superior (~12px) de la primera fila no queden recortados por overflow,
          sin desalinear la grilla respecto del header. */}
      <div className="-m-3 min-h-0 flex-1 overflow-y-auto p-3 pb-mobile-nav">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCards.map((card) => (
            <Fragment key={card.creator_id || card.account_id}>
              {renderCard(card)}
            </Fragment>
          ))}
        </div>
        {query.hasNextPage ? (
          <div className="flex justify-center pt-4">
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
    </div>
  )
}

function DiscoveryGridSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]">
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="status"
        aria-label={t`Cargando creadores`}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="aspect-[316/286] animate-pulse rounded-2xl border border-border bg-muted"
          />
        ))}
      </div>
    </div>
  )
}
