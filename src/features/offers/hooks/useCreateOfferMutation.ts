import { useMutation } from '@tanstack/react-query'

import type {
  BonusAmount,
  CreateOfferRequest,
  OfferBonusTerms,
  OfferDeliverableDTO,
  OfferSendReturnTo,
} from '#/shared/api/generated/model'
import type {
  createOfferResponse,
  createOfferResponse201,
} from '#/shared/api/generated/offers/offers'
import { createOffer } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

import type {
  CreateOfferFormValues,
  OfferBonusTermsFormValues,
  OfferBonusWindowFormValues,
} from '../schemas/createOffer'

export type CreateOfferMutationVariables = CreateOfferFormValues & {
  conversation_id: string
  offer_draft_id?: string
  return_to?: OfferSendReturnTo
}

function toDecimalString(value: number): string {
  return value.toFixed(2)
}

function toBonusAmount(
  bonusAmount: OfferBonusWindowFormValues['bonus_amount'],
): BonusAmount {
  if (bonusAmount.type === 'percentage') {
    return { type: 'percentage', value: bonusAmount.value }
  }
  return { type: 'fixed', amount: toDecimalString(bonusAmount.amount_usd) }
}

function toBonusTerms(
  bonusTerms: OfferBonusTermsFormValues | undefined,
): OfferBonusTerms | null {
  if (!bonusTerms?.enabled) return null

  return {
    speed_bonus_windows: bonusTerms.speed_bonus_windows.map((window) => ({
      window_hours: window.window_hours,
      bonus_amount: toBonusAmount(window.bonus_amount),
    })),
  }
}

function toDeliverables(
  platforms: CreateOfferFormValues['platforms'],
): OfferDeliverableDTO[] {
  return platforms.map((platform, index) => ({
    position: index + 1,
    platform,
    format: '',
    quantity: 1,
  }))
}

function toCreateOfferRequest(
  variables: CreateOfferMutationVariables,
): CreateOfferRequest {
  return {
    offer_draft_id: variables.offer_draft_id,
    return_to: variables.return_to,
    campaign_id: variables.campaign_id,
    conversation_id: variables.conversation_id,
    offer_mode: variables.offer_mode,
    amount: toDecimalString(variables.amount),
    tentative_publish_date: variables.tentative_publish_date,
    offer_deadline: variables.offer_deadline,
    description: '',
    bonus_terms: toBonusTerms(variables.bonus_terms),
    platforms: variables.platforms,
    deliverables: toDeliverables(variables.platforms),
  }
}

function assertCreateOfferCreatedResponse(
  response: createOfferResponse,
): createOfferResponse201 {
  if (response.status !== 201) {
    throw new Error('Unexpected createOffer response status')
  }

  return response
}

export function useCreateOfferMutation() {
  return useMutation({
    mutationFn: async (variables: CreateOfferMutationVariables) => {
      const response = await createOffer(toCreateOfferRequest(variables), {
        headers: {
          'Idempotency-Key': generateIdempotencyKey(),
        },
      })

      return assertCreateOfferCreatedResponse(response)
    },
  })
}
