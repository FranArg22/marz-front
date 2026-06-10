import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBrandPaymentsSpending } from '../api/getBrandPaymentsSpending'
import {
  getBrandPaymentsSpendingQueryKey,
  useBrandPaymentsSpendingQuery,
} from './useBrandPaymentsSpendingQuery'

vi.mock('../api/getBrandPaymentsSpending', () => ({
  getBrandPaymentsSpending: vi.fn(),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'acct-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

const mockGetBrandPaymentsSpending = vi.mocked(getBrandPaymentsSpending)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useBrandPaymentsSpendingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBrandPaymentsSpending.mockResolvedValue({
      summary: {
        total_spent: '0',
        period_spend: '0',
        pending_approval: '0',
        next_debit: {
          amount: '0',
          estimated_date: null,
          date_available: false,
        },
      },
      monthly_spend: [],
      campaign_breakdown: [],
      filters: {
        period: '30d',
        campaign_id: null,
        creator_account_id: null,
        q: '',
        limit: 50,
      },
      payments: { items: [], next_cursor: null, has_more: false, total_visible: 0 },
    })
  })

  it('builds a stable query key without undefined filters', () => {
    expect(
      getBrandPaymentsSpendingQueryKey('workspace-1', {
        filters: {
          period: '30d',
          campaignId: undefined,
          creatorId: '11111111-1111-4111-8111-111111111111',
          q: '',
        },
      }),
    ).toEqual([
      'brand-payments-spending',
      'workspace-1',
      { period: '30d', creatorId: '11111111-1111-4111-8111-111111111111' },
    ])
  })

  it('changes the query key when filters change', () => {
    const baseKey = getBrandPaymentsSpendingQueryKey('workspace-1', {
      filters: { period: '30d', q: 'ana' },
    })
    const changedKey = getBrandPaymentsSpendingQueryKey('workspace-1', {
      filters: { period: '90d', q: 'ana' },
    })

    expect(changedKey).not.toEqual(baseKey)
  })

  it('passes cursor to the server function for keyset pagination', async () => {
    mockGetBrandPaymentsSpending
      .mockResolvedValueOnce({
        summary: {
          total_spent: '0',
          period_spend: '0',
          pending_approval: '0',
          next_debit: {
            amount: '0',
            estimated_date: null,
            date_available: false,
          },
        },
        monthly_spend: [],
        campaign_breakdown: [],
        filters: {
          period: '30d',
          campaign_id: null,
          creator_account_id: null,
          q: '',
          limit: 50,
        },
        payments: { items: [], next_cursor: 'cursor-2', has_more: false, total_visible: 0 },
      })
      .mockResolvedValueOnce({
        summary: {
          total_spent: '0',
          period_spend: '0',
          pending_approval: '0',
          next_debit: {
            amount: '0',
            estimated_date: null,
            date_available: false,
          },
        },
        monthly_spend: [],
        campaign_breakdown: [],
        filters: {
          period: '30d',
          campaign_id: null,
          creator_account_id: null,
          q: '',
          limit: 50,
        },
        payments: { items: [], next_cursor: null, has_more: false, total_visible: 0 },
      })

    const { result } = renderHook(
      () =>
        useBrandPaymentsSpendingQuery({
          filters: { period: '30d', campaignId: 'campaign-1' },
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(mockGetBrandPaymentsSpending).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            period: '30d',
            campaignId: 'campaign-1',
            workspaceId: 'workspace-1',
          },
        }),
      )
    })

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(true)
    })

    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(mockGetBrandPaymentsSpending).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            period: '30d',
            campaignId: 'campaign-1',
            workspaceId: 'workspace-1',
            cursor: 'cursor-2',
          },
        }),
      )
    })
  })
})
