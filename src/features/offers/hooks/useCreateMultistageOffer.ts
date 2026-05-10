import { useMutation } from '@tanstack/react-query'
import type { CreateMultiStageOfferRequest as GeneratedCreateMultiStageOfferRequest } from '#/shared/api/generated/model'
import { createSingleOffer } from '#/shared/api/generated/offers/offers'

import {
  trackOfferEvent,
  toAmountBucket,
  maxDeadlineFromNow,
} from '../analytics'

export type CreateMultistageOfferRequest = GeneratedCreateMultiStageOfferRequest

export function useCreateMultistageOffer() {
  return useMutation({
    mutationFn: (data: CreateMultistageOfferRequest) => createSingleOffer(data),
    onSuccess: (_data, variables) => {
      const total = variables.stages.reduce(
        (sum, s) => sum + parseFloat(s.amount),
        0,
      )
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'multistage',
        platform_mix: [],
        stages_count: variables.stages.length,
        has_bonus_terms: false,
        total_amount_bucket: toAmountBucket(total, 'USD'),
        deadline_days_from_now: maxDeadlineFromNow(
          variables.stages.map((stage) => stage.deadline),
        ),
      })
    },
  })
}
