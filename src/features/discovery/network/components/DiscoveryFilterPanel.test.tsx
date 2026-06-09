import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'
import { DiscoveryFilterPanel } from './DiscoveryFilterPanel'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/generated/lookups/lookups', () => ({
  useListCountries: vi.fn(() => ({
    data: {
      status: 200,
      data: { items: [{ code: 'AR', label_es: 'Argentina' }] },
    },
  })),
  useListInterests: vi.fn(() => ({
    data: {
      status: 200,
      data: { items: [{ slug: 'beauty', label_es: 'Belleza' }] },
    },
  })),
  useListContentTypes: vi.fn(() => ({
    data: {
      status: 200,
      data: { items: [{ slug: 'reviews', label_es: 'Reviews' }] },
    },
  })),
}))

function resetStore(pendingFilters = {}) {
  useDiscoveryFiltersStore.setState({
    pendingFilters,
    appliedFilters: {},
    activeSort: 'recommended',
    selectedAccountIds: new Set<string>(),
    selectionMode: false,
  })
}

describe('DiscoveryFilterPanel validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  afterEach(() => {
    resetStore()
  })

  it('disables Apply and shows an error when followers min > max', () => {
    resetStore({ followers_min: 5000, followers_max: 1000 })
    render(<DiscoveryFilterPanel open onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
    expect(
      screen.getByText('El valor inicial no puede ser mayor que el final.'),
    ).toBeInTheDocument()
  })

  it('keeps Apply enabled and applies filters for a valid range', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    resetStore({ followers_min: 1000, followers_max: 5000 })
    render(<DiscoveryFilterPanel open onClose={onClose} />)

    const applyButton = screen.getByRole('button', { name: 'Aplicar' })
    expect(applyButton).toBeEnabled()
    expect(
      screen.queryByText('El valor inicial no puede ser mayor que el final.'),
    ).not.toBeInTheDocument()

    await user.click(applyButton)

    expect(useDiscoveryFiltersStore.getState().appliedFilters).toEqual({
      followers_min: 1000,
      followers_max: 5000,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('disables Apply for an invalid decimal CPM range', () => {
    resetStore({ cpm_min: '10', cpm_max: '5' })
    render(<DiscoveryFilterPanel open onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
  })
})
