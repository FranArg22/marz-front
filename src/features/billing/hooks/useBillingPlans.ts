import { useListBillingPlans } from '#/shared/api/generated/brand/brand'

export type {
  BillingPlansResponse,
  BillingPlan,
} from '#/shared/api/generated/model'

export function useBillingPlans() {
  return useListBillingPlans()
}
