import { useMutation } from '@tanstack/react-query'
import type { CreateBundleOfferRequest as GeneratedCreateBundleOfferRequest } from '#/shared/api/generated/model'
import { createSingleOffer } from '#/shared/api/generated/offers/offers'

import {
  trackOfferEvent,
  toAmountBucket,
  daysFromNow,
  toPlatformMix,
} from '../analytics'

export type CreateBundleOfferRequest = GeneratedCreateBundleOfferRequest

export function useCreateBundleOffer() {
  return useMutation({
    mutationFn: (data: CreateBundleOfferRequest) => createSingleOffer(data),
    onSuccess: (_data, variables) => {
      const amount = parseFloat(variables.amount)
      const hasBonusTerms =
        (variables.bonus_terms?.speed_bonus_windows.length ?? 0) > 0
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'bundle',
        platform_mix: toPlatformMix(variables.deliverables),
        deliverables_count: variables.deliverables.length,
        has_bonus_terms: hasBonusTerms,
        total_amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
