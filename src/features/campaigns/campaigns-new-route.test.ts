import { createElement } from 'react'
import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from '@tanstack/react-router'

import { ApiError } from '#/shared/api/mutator'
import type { createCampaignResponse } from '#/shared/api/generated/campaigns/campaigns'
import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import type { CreateCampaignMutationVariables } from './wizard/mutations'
import { useCampaignWizardStore } from './wizard/store'
import type { CampaignWizardState } from './wizard/store'

const routerMock = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()

  return {
    ...actual,
    useRouter: () => routerMock,
  }
})

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

vi.mock('#/features/campaigns/wizard/mutations', () => ({
  useCreateCampaignMutation: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('#/features/campaigns/wizard/WizardStep1ContentType', () => ({
  WizardStep1ContentType: () => null,
}))

vi.mock('#/features/campaigns/wizard/WizardStep2PricingModel', () => ({
  WizardStep2PricingModel: () => null,
}))

vi.mock('#/features/campaigns/wizard/WizardStep3Brief', () => ({
  WizardStep3Brief: () => null,
}))

vi.mock('#/features/campaigns/wizard/WizardStep4Audience', () => ({
  WizardStep4Audience: () => null,
}))

vi.mock('#/features/campaigns/wizard/WizardStep5Compensation', () => ({
  WizardStep5Compensation: () => null,
}))

vi.mock('#/features/campaigns/wizard/WizardStep6Content', () => ({
  WizardStep6Content: () => null,
}))

const originalActions = {
  setStep1: useCampaignWizardStore.getState().setStep1,
  setStep2: useCampaignWizardStore.getState().setStep2,
  setStep3: useCampaignWizardStore.getState().setStep3,
  setStep4: useCampaignWizardStore.getState().setStep4,
  setStep5: useCampaignWizardStore.getState().setStep5,
  setStep6: useCampaignWizardStore.getState().setStep6,
  markStepCompleted: useCampaignWizardStore.getState().markStepCompleted,
  canAccessStep: useCampaignWizardStore.getState().canAccessStep,
  reset: useCampaignWizardStore.getState().reset,
}

describe('/_brand/campaigns/new route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetWizardStore()
    resetTrackedEvents()
  })

  it('validates the campaign wizard step search param', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const validateSearch = (
      Route.options as unknown as {
        validateSearch: (search: Record<string, unknown>) => unknown
      }
    ).validateSearch

    expect(validateSearch({})).toEqual({ step: 1 })
    expect(validateSearch({ step: 7 })).toEqual({ step: 7 })
    expect(() => validateSearch({ step: 8 })).toThrow()
  })

  it('redirects inaccessible steps back to step 1', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const beforeLoad = (
      Route.options as unknown as {
        beforeLoad: (options: { search: { step: number } }) => void
      }
    ).beforeLoad

    useCampaignWizardStore.setState({ completedSteps: [] })

    try {
      beforeLoad({ search: { step: 3 } })
      throw new Error('beforeLoad did not redirect')
    } catch (error) {
      expect(error).toEqual(
        redirect({ to: '/campaigns/new', search: { step: 1 } }),
      )
    }
  })

  it('tracks the campaign wizard step when the search step changes', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const useSearchSpy = vi.spyOn(Route, 'useSearch')
    const Component = getRouteComponent(Route)

    useSearchSpy.mockReturnValue({ step: 1 })
    const view = render(createElement(Component))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_step_entered',
        payload: { step_number: 1 },
      }),
    ])

    useSearchSpy.mockReturnValue({ step: 2 })
    view.rerender(createElement(Component))

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_step_entered',
        payload: { step_number: 1 },
      }),
      expect.objectContaining({
        event: 'campaign_wizard_step_entered',
        payload: { step_number: 2 },
      }),
    ])
  })

  it('tracks the completed campaign wizard step when continuing', async () => {
    const user = userEvent.setup()
    const { Route } = await import('#/routes/_brand/campaigns.new')
    vi.spyOn(Route, 'useSearch').mockReturnValue({ step: 1 })
    useCampaignWizardStore.getState().setStep1({
      content_type: 'influencer_posts',
    })

    render(createElement(getRouteComponent(Route)))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(routerMock.navigate).toHaveBeenCalledWith({
      to: '/campaigns/new',
      search: { step: 2 },
    })
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_step_entered',
        payload: { step_number: 1 },
      }),
      expect.objectContaining({
        event: 'campaign_wizard_step_completed',
        payload: { step_number: 1 },
      }),
    ])
  })

  it('submits the review payload and navigates to the created campaign', async () => {
    const { submitCampaignWizard } = await import('#/routes/_brand/campaigns.new')
    const navigateToCampaign = vi.fn()
    const reset = vi.fn()
    const setSubmitError = vi.fn()
    const mutate = vi.fn(
      (
        _variables: CreateCampaignMutationVariables,
        options?: {
          onSuccess?: (response: createCampaignResponse) => void
        },
      ) => {
        options?.onSuccess?.({
          status: 201,
          data: { id: 'campaign-1' },
          headers: new Headers(),
        } as createCampaignResponse)
      },
    )

    const submitted = submitCampaignWizard({
      state: createCompleteState(),
      mutate,
      navigateToCampaign,
      reset,
      setSubmitError,
    })

    expect(submitted).toBe(true)
    expect(mutate).toHaveBeenCalledWith(
      {
        data: expect.objectContaining({
          content_type: 'influencer_posts',
          pricing_model: 'pay_per_post',
          name: 'Launch campaign',
        }),
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
    expect(setSubmitError).toHaveBeenCalledWith(null)
    expect(reset).toHaveBeenCalled()
    expect(navigateToCampaign).toHaveBeenCalledWith('campaign-1')
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_submitted',
        payload: { completed_steps: [1, 2, 3, 4, 5, 6] },
      }),
      expect.objectContaining({
        event: 'campaign_wizard_created',
        payload: { campaign_id: 'campaign-1' },
      }),
    ])
  })

  it('surfaces typed 422 campaign creation errors', async () => {
    const { submitCampaignWizard } = await import('#/routes/_brand/campaigns.new')
    const navigateToCampaign = vi.fn()
    const reset = vi.fn()
    const setSubmitError = vi.fn()
    const mutate = vi.fn(
      (
        _variables: CreateCampaignMutationVariables,
        options?: {
          onError?: (error: Error) => void
        },
      ) => {
        options?.onError?.(
          new ApiError(
            422,
            'validation_failed',
            'Validation failed',
            { field_errors: { name: ['Name is required'] } },
          ),
        )
      },
    )

    submitCampaignWizard({
      state: createCompleteState(),
      mutate,
      navigateToCampaign,
      reset,
      setSubmitError,
    })

    expect(setSubmitError).toHaveBeenLastCalledWith(
      'Revisá los datos de la campaña: Name is required',
    )
    expect(reset).not.toHaveBeenCalled()
    expect(navigateToCampaign).not.toHaveBeenCalled()
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_submitted',
      }),
      expect.objectContaining({
        event: 'campaign_wizard_failed',
        payload: { reason: 'Revisá los datos de la campaña: Name is required' },
      }),
    ])
  })
})

function getRouteComponent(Route: {
  options: { component?: ComponentType }
}): ComponentType {
  const Component = Route.options.component
  if (!Component) {
    throw new Error('Route component is not defined')
  }

  return Component
}

function resetWizardStore() {
  useCampaignWizardStore.setState({
    step1: { content_type: null },
    step2: { pricing_model: null },
    step3: {
      name: '',
      description: '',
      target_url: '',
      imageFile: null,
      imageBlobUrl: null,
      imageS3Key: null,
    },
    step4: {
      platforms: [],
      interests: [],
      creator_country: null,
      min_creator_tier_slug: null,
    },
    step5: {
      compensation_type: null,
      compensation_notes: '',
      video_reuse_permission_default: false,
    },
    step6: {
      content_guidelines: '',
      briefPdfFile: null,
      briefPdfS3Key: null,
    },
    completedSteps: [],
    isDirty: false,
    ...originalActions,
  })
}

function createCompleteState(): CampaignWizardState {
  const noop = () => undefined

  return {
    step1: { content_type: 'influencer_posts' },
    step2: { pricing_model: 'pay_per_post' },
    step3: {
      name: 'Launch campaign',
      description: 'Creators introduce the new product line.',
      target_url: 'https://example.com',
      imageFile: null,
      imageBlobUrl: null,
      imageS3Key: 'tmp/campaigns/image.png',
    },
    step4: {
      platforms: ['instagram'],
      interests: ['beauty'],
      creator_country: 'AR',
      min_creator_tier_slug: 'micro',
    },
    step5: {
      compensation_type: 'payment',
      compensation_notes: '',
      video_reuse_permission_default: false,
    },
    step6: {
      content_guidelines:
        'Show the product in use, mention the key benefit, and keep the tone natural.',
      briefPdfFile: null,
      briefPdfS3Key: null,
    },
    completedSteps: [1, 2, 3, 4, 5, 6],
    isDirty: true,
    setStep1: noop,
    setStep2: noop,
    setStep3: noop,
    setStep4: noop,
    setStep5: noop,
    setStep6: noop,
    markStepCompleted: noop,
    canAccessStep: () => true,
    reset: noop,
  }
}
