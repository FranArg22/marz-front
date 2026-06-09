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
  setPendingFilters: (filters: DiscoveryFilters) => void
  applyFilters: () => void
  resetPendingFilters: () => void
  clearFilters: () => void
  setSort: (sort: GetDiscoveryCreatorsParams['sort']) => void
}

const EMPTY_FILTERS: DiscoveryFilters = {}

export const useDiscoveryFiltersStore = create<DiscoveryFiltersStore>()(
  (set) => ({
    pendingFilters: EMPTY_FILTERS,
    appliedFilters: EMPTY_FILTERS,
    activeSort: 'recommended',
    setPendingFilters: (filters) => set({ pendingFilters: filters }),
    applyFilters: () =>
      set((state) => ({ appliedFilters: state.pendingFilters })),
    resetPendingFilters: () =>
      set((state) => ({ pendingFilters: state.appliedFilters })),
    clearFilters: () => set({ pendingFilters: EMPTY_FILTERS }),
    setSort: (sort) => set({ activeSort: sort }),
  }),
)

export function countActiveFilters(filters: DiscoveryFilters): number {
  return Object.values(filters).filter(
    (value) => !Array.isArray(value) || value.length > 0,
  ).length
}
