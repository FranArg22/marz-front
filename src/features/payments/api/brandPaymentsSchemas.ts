import { z } from 'zod'

export const brandPaymentsSearchSchema = z.object({
  period: z.enum(['30d', '90d', '12m', 'all']).default('30d'),
  campaignId: z.uuid().optional().catch(undefined),
  creatorId: z.uuid().optional().catch(undefined),
  q: z.string().max(100).optional().catch(undefined),
})

export const brandPaymentsSpendingInputSchema =
  brandPaymentsSearchSchema.extend({
    workspaceId: z.string().min(1),
    cursor: z.string().optional(),
  })

export const exportBrandPaymentsCsvInputSchema =
  brandPaymentsSearchSchema.extend({
    workspaceId: z.string().min(1),
  })

export type BrandPaymentsSearch = z.infer<typeof brandPaymentsSearchSchema>

// Types below mirror the API contract (source of truth): the Orval-generated
// models in `#/shared/api/generated/model`. Re-exported here so feature code has
// a single import surface.
export type {
  BrandPaymentsSpendingSummary as BrandPaymentsSummary,
  BrandPaymentsSpendingSummaryNextDebit as BrandPaymentsNextDebit,
  BrandPaymentsSpendingBucket as BrandPaymentsMonthlySpend,
  BrandPaymentsSpendingCampaign as BrandPaymentsCampaignBreakdown,
  BrandPaymentsSpendingFilters as BrandPaymentsFilters,
  BrandPaymentsSpendingPayments as BrandPaymentsPageData,
  BrandPaymentHistoryRow,
  BrandPaymentsSpendingResponse,
} from '#/shared/api/generated/model'

export interface BrandPaymentsCampaignFilter {
  campaign_id: string
  campaign_name: string
}

export interface BrandPaymentsCreatorFilter {
  creator_account_id: string
  creator_display_name: string
  creator_handle: string | null
}

export function normalizeBrandPaymentsFilters(
  filters: BrandPaymentsSearch,
): BrandPaymentsSearch {
  const query = filters.q?.trim()

  return {
    period: filters.period,
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
    ...(query ? { q: query } : {}),
  }
}

export function toBrandPaymentsQueryParams(
  input: BrandPaymentsSearch & { cursor?: string },
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('period', input.period)
  if (input.campaignId) params.set('campaign_id', input.campaignId)
  if (input.creatorId) params.set('creator_account_id', input.creatorId)
  if (input.q) params.set('q', input.q)
  if (input.cursor) params.set('cursor', input.cursor)
  return params
}
