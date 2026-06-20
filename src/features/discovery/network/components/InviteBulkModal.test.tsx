import { render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateDiscoveryConnectionRequestsBulk } from '#/shared/api/generated/brand/brand'

import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'
import { InviteBulkModal } from './InviteBulkModal'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

const invalidateQueries = vi.fn().mockResolvedValue(undefined)
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('#/shared/api/generated/brand/brand', () => ({
  createDiscoveryConnectionRequestsBulk: vi.fn(),
  useCreateDiscoveryConnectionRequestsBulk: vi.fn(),
}))

const mockUseBulk = vi.mocked(useCreateDiscoveryConnectionRequestsBulk)

let mutationOptions: { mutation?: Record<string, unknown> } | undefined
const mutate = vi.fn()
const reset = vi.fn()

function resetStore() {
  useDiscoveryFiltersStore.setState({
    pendingFilters: {},
    appliedFilters: {},
    activeSort: 'recommended',
    selectedAccountIds: new Set(['acc-1', 'acc-2']),
    selectionMode: true,
  })
}

function triggerSuccess(skipped_count: number, created_count = 2) {
  return (
    mutationOptions?.mutation?.onSuccess as (data: unknown) => Promise<void>
  )({
    status: 201,
    data: { summary: { created_count, skipped_count } },
  })
}

describe('InviteBulkModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
    mutationOptions = undefined
    mockUseBulk.mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions
      return { mutate, reset, isPending: false } as unknown as ReturnType<
        typeof useCreateDiscoveryConnectionRequestsBulk
      >
    })
  })

  it('success without skips: plain count message, clears selection and closes', async () => {
    const onOpenChange = vi.fn()
    render(
      <InviteBulkModal
        open
        onOpenChange={onOpenChange}
        accountIds={['acc-1', 'acc-2']}
      />,
    )

    await triggerSuccess(0)

    expect(toast.success).toHaveBeenCalledWith('Se enviaron 2 invitaciones.')
    expect(useDiscoveryFiltersStore.getState().selectedAccountIds.size).toBe(0)
    expect(useDiscoveryFiltersStore.getState().selectionMode).toBe(false)
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['discovery', 'creators'],
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('success with skips: surfaces the skipped_count in the message', async () => {
    render(
      <InviteBulkModal
        open
        onOpenChange={vi.fn()}
        accountIds={['acc-1', 'acc-2']}
      />,
    )

    await triggerSuccess(1, 2)

    expect(toast.success).toHaveBeenCalledWith(
      'Se enviaron 2 invitaciones. 1 creadores fueron omitidos porque ya tienen una invitación pendiente, conversación activa u oferta activa.',
    )
  })

  it('error: shows a generic toast and keeps selection', () => {
    render(
      <InviteBulkModal open onOpenChange={vi.fn()} accountIds={['acc-1']} />,
    )
    ;(mutationOptions?.mutation?.onError as () => void)()

    expect(toast.error).toHaveBeenCalledWith('Algo salió mal. Intentá de nuevo.')
    expect(useDiscoveryFiltersStore.getState().selectedAccountIds.size).toBe(2)
  })

  it('disables submit when there are no selected accounts', () => {
    render(<InviteBulkModal open onOpenChange={vi.fn()} accountIds={[]} />)

    expect(
      screen.getByRole('button', { name: 'Enviar invitaciones' }),
    ).toBeDisabled()
  })
})
