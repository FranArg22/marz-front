import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { getMeQueryKey, useMe } from '#/shared/api/generated/accounts/accounts'
import { useCompleteBrandOnboarding } from '#/shared/api/generated/onboarding/onboarding'
import type { BrandOnboardingPayload } from '#/shared/api/generated/model/brandOnboardingPayload'
import type { CompleteBrandOnboardingResponse } from '#/shared/api/generated/model/completeBrandOnboardingResponse'
import { ApiError } from '#/shared/api/mutator'
import { track } from '#/shared/analytics/track'

import { CompleteBrandOnboardingBody } from '#/shared/api/generated/zod/onboarding/onboarding'

import type { FieldErrors } from './store'
import { useBrandOnboardingStore } from './store'
import { getStepIndex } from './steps'

const FIELD_TO_STEP: Record<string, string> = {
  name: 'identity',
  website_url: 'identity',
  vertical: 'vertical',
  marketing_objective: 'objective',
  creator_experience: 'experience',
  creator_sourcing_intent: 'experience',
  monthly_budget_range: 'budget',
  timing: 'timing',
  contact_name: 'contact',
  contact_title: 'contact',
  contact_whatsapp_e164: 'contact',
  attribution: 'attribution',
}

export function useSubmitBrandOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useCompleteBrandOnboarding()
  const meQuery = useMe({ query: { enabled: false } })

  const submit = () => {
    const state = useBrandOnboardingStore.getState()
    const {
      currentStepIndex: _,
      setField,
      setSelectedPlan: _sp,
      setSelectedInterval: _si,
      setFlowChoice: _sfc,
      setFieldErrors: _sfe,
      clearFieldErrors: _cfe,
      goTo: _g,
      reset,
      selectedPlan,
      selectedInterval,
      flowChoice,
      fieldErrors: _fe,
      ...fields
    } = state

    if (
      typeof fields.website_url === 'string' &&
      fields.website_url.trim() &&
      !/^https?:\/\//i.test(fields.website_url.trim())
    ) {
      const normalized = `https://${fields.website_url.trim()}`
      setField('website_url', normalized)
      fields.website_url = normalized
    }

    const parsed = CompleteBrandOnboardingBody.safeParse(fields)
    if (!parsed.success) {
      const inlineErrors: FieldErrors = {}
      let firstStepId: string | undefined
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0] as keyof FieldErrors | undefined
        if (fieldName && !inlineErrors[fieldName]) {
          inlineErrors[fieldName] = issue.message
          if (!firstStepId) {
            firstStepId = FIELD_TO_STEP[fieldName]
          }
        }
      }
      const store = useBrandOnboardingStore.getState()
      store.setFieldErrors(inlineErrors)
      if (firstStepId) {
        const idx = getStepIndex(firstStepId)
        if (idx >= 0) {
          store.goTo(idx)
          void navigate({
            to: '/onboarding/brand/$step',
            params: { step: firstStepId },
          })
        }
      }
      return
    }

    if (flowChoice === 'paid' && (!selectedPlan || !selectedInterval)) {
      const paywallStepId = 'paywall'
      const idx = getStepIndex(paywallStepId)
      if (idx >= 0) {
        useBrandOnboardingStore.getState().goTo(idx)
        void navigate({
          to: '/onboarding/brand/$step',
          params: { step: paywallStepId },
        })
      }
      toast.error(t`Elegí un plan para continuar.`)
      return
    }

    const billingIntent =
      flowChoice === 'paid'
        ? {
            plan: selectedPlan!,
            interval: selectedInterval!,
            success_url: `${window.location.origin}/onboarding/brand/billing-callback?checkout=success`,
            cancel_url: `${window.location.origin}/onboarding/brand/billing-callback?checkout=cancel`,
          }
        : undefined

    const payload: BrandOnboardingPayload = {
      ...parsed.data,
      billing_intent: billingIntent,
    }

    mutation.mutate(
      { data: payload },
      {
        onSuccess: (response) => {
          if (response.status === 200) {
            const data = response.data as CompleteBrandOnboardingResponse
            if (data.checkout_url) {
              window.location.assign(data.checkout_url)
              return
            }
          }
          reset()
          void queryClient.invalidateQueries({ queryKey: getMeQueryKey() })
          track('onboarding_completed', { kind: 'brand' })
          void navigate({ to: '/campaigns' })
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            toast.error(t`Ocurrió un error inesperado. Intentá de nuevo.`)
            return
          }

          if (error.status === 422) {
            const rawFieldErrors = error.details?.field_errors
            if (rawFieldErrors) {
              const inlineErrors: FieldErrors = {}
              let firstStepId: string | undefined
              for (const [field, messages] of Object.entries(rawFieldErrors)) {
                if (messages.length > 0) {
                  inlineErrors[field as keyof FieldErrors] = messages[0]
                  if (!firstStepId) {
                    firstStepId = FIELD_TO_STEP[field]
                  }
                }
              }
              const store = useBrandOnboardingStore.getState()
              store.setFieldErrors(inlineErrors)
              if (firstStepId) {
                const idx = getStepIndex(firstStepId)
                if (idx >= 0) {
                  store.goTo(idx)
                  void navigate({
                    to: '/onboarding/brand/$step',
                    params: { step: firstStepId },
                  })
                }
              }
              return
            }
            const code = error.code
            const isBillingValidation =
              code === 'validation.invalid_url' ||
              code === 'validation.invalid_plan' ||
              code === 'validation.invalid_interval' ||
              code === 'validation.invalid_workspace' ||
              code === 'subscription_already_active'
            toast.error(error.message || t`No pudimos completar el onboarding.`)
            if (isBillingValidation) {
              const idx = getStepIndex('paywall')
              if (idx >= 0) {
                useBrandOnboardingStore.getState().goTo(idx)
                void navigate({
                  to: '/onboarding/brand/$step',
                  params: { step: 'paywall' },
                })
              }
            }
            return
          }

          if (error.status === 409) {
            void meQuery.refetch().then((result) => {
              const redirectTo =
                result.data?.status === 200
                  ? result.data.data.redirect_to
                  : null
              void navigate({ to: redirectTo ?? '/campaigns' })
            })
            return
          }

          toast.error(t`Ocurrió un error inesperado. Intentá de nuevo.`)
        },
      },
    )
  }

  return { submit, isPending: mutation.isPending }
}
