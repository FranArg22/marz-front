import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

import { trackOfferEvent, toAmountBucket, daysFromNow } from '../analytics'

export interface CreateSingleOfferRequest {
  campaign_id: string
  conversation_id: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  format:
    | 'yt_long'
    | 'yt_short'
    | 'ig_reel'
    | 'ig_story'
    | 'ig_post'
    | 'tiktok_post'
  amount: string
  deadline: string
  speed_bonus?: {
    early_deadline: string
    bonus_amount: string
  } | null
}

interface OfferDTO {
  id: string
  campaign_id: string
  campaign_name: string
  brand_workspace_id: string
  creator_account_id: string
  type: 'single'
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
  total_amount: string
  currency: string
  deadline: string
  speed_bonus: {
    early_deadline: string
    bonus_amount: string
    currency: string
  } | null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
}

interface CreateOfferResponse {
  data: OfferDTO
  status: number
}

// CLOSER:DRIFT: backend now exposes CreateSingleOfferRequest with required fields
// `description` (≤5000) and nested `deliverable: OfferDeliverableDTO`. Local body shape
// is a subset and predates that contract. Migrating requires a UI field for description
// and a conscious mapping from the flat form to the nested DTO; left as-is to avoid
// inventing product copy. Generated hook lives at
// `src/shared/api/generated/offers/offers.ts:useCreateSingleOffer`.
export function useCreateSingleOffer() {
  return useMutation<CreateOfferResponse, Error, CreateSingleOfferRequest>({
    mutationFn: (data) =>
      customFetch<CreateOfferResponse>('/v1/offers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      const amount = parseFloat(variables.amount)
      const hasSpeedBonus =
        variables.speed_bonus !== undefined && variables.speed_bonus !== null
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'single',
        platform_mix: [variables.platform],
        has_speed_bonus: hasSpeedBonus,
        total_amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
