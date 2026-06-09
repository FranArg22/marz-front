import { create } from 'zustand'
import type { GetDiscoveryCreatorsParams } from '#/shared/api/generated/model'

export type DiscoveryFilters = Omit<
  GetDiscoveryCreatorsParams,
  'cursor' | 'limit' | 'sort'
>

type DiscoveryFiltersStore = {
  pendingFilters: DiscoveryFilters
  appliedFilters: DiscoveryFilters
  activeSort: GetDiscoveryCreatorsParams['sort']
  selectedAccountIds: Set<string>
  selectionMode: boolean
  setPendingFilters: (filters: DiscoveryFilters) => void
  applyFilters: () => void
  resetPendingFilters: () => void
  clearFilters: () => void
  setSort: (sort: GetDiscoveryCreatorsParams['sort']) => void
  toggleSelectionMode: () => void
  toggleSelect: (accountId: string) => void
  clearSelection: () => void
}

const EMPTY_FILTERS: DiscoveryFilters = {}

export const useDiscoveryFiltersStore = create<DiscoveryFiltersStore>()(
  (set) => ({
    pendingFilters: EMPTY_FILTERS,
    appliedFilters: EMPTY_FILTERS,
    activeSort: 'er_desc',
    selectedAccountIds: new Set<string>(),
    selectionMode: false,
    setPendingFilters: (filters) => set({ pendingFilters: filters }),
    applyFilters: () =>
      set((state) => ({ appliedFilters: state.pendingFilters })),
    resetPendingFilters: () =>
      set((state) => ({ pendingFilters: state.appliedFilters })),
    clearFilters: () => set({ pendingFilters: EMPTY_FILTERS }),
    setSort: (sort) => set({ activeSort: sort }),
    toggleSelectionMode: () =>
      set((state) => ({
        selectionMode: !state.selectionMode,
        selectedAccountIds: new Set<string>(),
      })),
    toggleSelect: (accountId) =>
      set((state) => {
        const selectedAccountIds = new Set(state.selectedAccountIds)
        if (selectedAccountIds.has(accountId)) {
          selectedAccountIds.delete(accountId)
        } else {
          selectedAccountIds.add(accountId)
        }
        return { selectedAccountIds }
      }),
    clearSelection: () => set({ selectedAccountIds: new Set<string>() }),
  }),
)

export function countActiveFilters(filters: DiscoveryFilters): number {
  let count = 0

  if (filters.platforms?.length) count += 1
  if (filters.gender) count += 1
  if (filters.countries?.length) count += 1
  if (filters.age_buckets?.length) count += 1
  if (filters.interests?.length) count += 1
  if (filters.content_types?.length) count += 1
  if (
    filters.followers_min !== undefined ||
    filters.followers_max !== undefined
  )
    count += 1
  if (filters.engagement_rate_min !== undefined) count += 1
  if (
    filters.avg_views_min !== undefined ||
    filters.avg_views_max !== undefined
  )
    count += 1
  if (hasStringValue(filters.cpm_min) || hasStringValue(filters.cpm_max))
    count += 1
  if (hasStringValue(filters.price_min) || hasStringValue(filters.price_max))
    count += 1

  return count
}

function hasStringValue(value: string | undefined): boolean {
  return value !== undefined && value !== ''
}
