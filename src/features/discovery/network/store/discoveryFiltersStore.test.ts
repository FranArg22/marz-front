import { beforeEach, describe, expect, it } from 'vitest'

import {
  countActiveFilters,
  useDiscoveryFiltersStore,
} from './discoveryFiltersStore'

function resetStore() {
  useDiscoveryFiltersStore.setState({
    pendingFilters: {},
    appliedFilters: {},
    activeSort: 'recommended',
    selectedAccountIds: new Set<string>(),
    selectionMode: false,
  })
}

describe('discoveryFiltersStore', () => {
  beforeEach(resetStore)

  it('setPendingFilters replaces the pending filters', () => {
    useDiscoveryFiltersStore.getState().setPendingFilters({ gender: 'female' })

    expect(useDiscoveryFiltersStore.getState().pendingFilters).toEqual({
      gender: 'female',
    })
    expect(useDiscoveryFiltersStore.getState().appliedFilters).toEqual({})
  })

  it('applyFilters copies pending into applied', () => {
    const store = useDiscoveryFiltersStore.getState()
    store.setPendingFilters({ countries: ['AR'] })
    useDiscoveryFiltersStore.getState().applyFilters()

    expect(useDiscoveryFiltersStore.getState().appliedFilters).toEqual({
      countries: ['AR'],
    })
  })

  it('resetPendingFilters restores pending from applied', () => {
    const store = useDiscoveryFiltersStore.getState()
    store.setPendingFilters({ countries: ['AR'] })
    useDiscoveryFiltersStore.getState().applyFilters()
    // diverge pending from applied
    useDiscoveryFiltersStore.getState().setPendingFilters({ countries: ['MX'] })

    useDiscoveryFiltersStore.getState().resetPendingFilters()

    expect(useDiscoveryFiltersStore.getState().pendingFilters).toEqual({
      countries: ['AR'],
    })
  })

  it('clearFilters empties pending but leaves applied untouched', () => {
    const store = useDiscoveryFiltersStore.getState()
    store.setPendingFilters({ countries: ['AR'] })
    useDiscoveryFiltersStore.getState().applyFilters()
    useDiscoveryFiltersStore.getState().setPendingFilters({ countries: ['MX'] })

    useDiscoveryFiltersStore.getState().clearFilters()

    expect(useDiscoveryFiltersStore.getState().pendingFilters).toEqual({})
    expect(useDiscoveryFiltersStore.getState().appliedFilters).toEqual({
      countries: ['AR'],
    })
  })

  describe('toggleSelect', () => {
    it('adds an account id when not selected', () => {
      useDiscoveryFiltersStore.getState().toggleSelect('acc-1')

      expect(
        useDiscoveryFiltersStore.getState().selectedAccountIds.has('acc-1'),
      ).toBe(true)
    })

    it('removes an account id when already selected', () => {
      useDiscoveryFiltersStore.getState().toggleSelect('acc-1')
      useDiscoveryFiltersStore.getState().toggleSelect('acc-1')

      expect(
        useDiscoveryFiltersStore.getState().selectedAccountIds.has('acc-1'),
      ).toBe(false)
    })

    it('keeps independent entries for distinct ids', () => {
      useDiscoveryFiltersStore.getState().toggleSelect('acc-1')
      useDiscoveryFiltersStore.getState().toggleSelect('acc-2')

      expect([
        ...useDiscoveryFiltersStore.getState().selectedAccountIds,
      ]).toEqual(['acc-1', 'acc-2'])
    })
  })

  it('toggleSelectionMode flips the flag and clears selection', () => {
    useDiscoveryFiltersStore.getState().toggleSelect('acc-1')
    useDiscoveryFiltersStore.getState().toggleSelectionMode()

    expect(useDiscoveryFiltersStore.getState().selectionMode).toBe(true)
    expect(useDiscoveryFiltersStore.getState().selectedAccountIds.size).toBe(0)
  })

  it('clearSelection empties the selected set', () => {
    useDiscoveryFiltersStore.getState().toggleSelect('acc-1')
    useDiscoveryFiltersStore.getState().clearSelection()

    expect(useDiscoveryFiltersStore.getState().selectedAccountIds.size).toBe(0)
  })
})

describe('countActiveFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveFilters({})).toBe(0)
  })

  it('ignores empty arrays', () => {
    expect(countActiveFilters({ platforms: [], countries: [] })).toBe(0)
  })

  it('counts a non-empty array filter as 1', () => {
    expect(countActiveFilters({ platforms: ['instagram'] })).toBe(1)
  })

  it('counts scalar filters', () => {
    expect(countActiveFilters({ gender: 'female' })).toBe(1)
  })

  it('counts a numeric range as a single active filter', () => {
    expect(countActiveFilters({ followers_min: 1000 })).toBe(1)
    expect(countActiveFilters({ followers_min: 1000, followers_max: 5000 })).toBe(
      1,
    )
  })

  it('ignores empty-string decimal range values', () => {
    expect(countActiveFilters({ cpm_min: '', cpm_max: '' })).toBe(0)
    expect(countActiveFilters({ cpm_min: '1.5' })).toBe(1)
  })

  it('sums multiple distinct active filters', () => {
    expect(
      countActiveFilters({
        platforms: ['instagram'],
        gender: 'female',
        countries: ['AR'],
        followers_min: 1000,
        engagement_rate_min: 3,
      }),
    ).toBe(5)
  })
})
