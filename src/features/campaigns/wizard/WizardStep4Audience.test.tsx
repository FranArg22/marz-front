import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
import { WizardStep4Audience } from './WizardStep4Audience'
import { useCampaignWizardStore } from './store'

vi.mock('./queries', () => ({
  useInterestsQuery: vi.fn(() => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'beauty', label_es: 'Belleza' },
          { slug: 'gaming', label_es: 'Gaming' },
        ],
      },
      headers: new Headers(),
    },
  })),
  useCountriesQuery: vi.fn(() => ({
    data: {
      status: 200,
      data: { items: [{ code: 'AR', label_es: 'Argentina' }] },
      headers: new Headers(),
    },
  })),
  useCreatorTiersQuery: vi.fn(() => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'micro', label_es: 'Micro', followers_min: 1000 },
          { slug: 'macro', label_es: 'Macro', followers_min: 100000 },
        ],
      },
      headers: new Headers(),
    },
  })),
  useCreatorCountQuery: vi.fn(() => ({
    data: {
      status: 200,
      data: { available: true, count: 12, computed_at: '2026-01-01T00:00:00Z' },
      headers: new Headers(),
    },
    isPending: false,
    isLoading: false,
    queryKey: [],
  })),
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

function resetStore() {
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

function renderStep4InLayout() {
  function Harness() {
    const step4 = useCampaignWizardStore((state) => state.step4)

    return (
      <WizardLayout
        step={4}
        totalSteps={7}
        onBack={() => {}}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (
            store.step4.platforms.length >= 1 &&
            store.step4.interests.length >= 1 &&
            store.step4.creator_country !== null &&
            store.step4.min_creator_tier_slug !== null
          ) {
            store.markStepCompleted(4)
          }
        }}
        nextDisabled={
          step4.platforms.length === 0 ||
          step4.interests.length === 0 ||
          step4.creator_country === null ||
          step4.min_creator_tier_slug === null
        }
      >
        <WizardStep4Audience />
      </WizardLayout>
    )
  }

  return render(<Harness />)
}

describe('WizardStep4Audience', () => {
  beforeEach(() => {
    resetStore()
  })

  it('keeps Continuar disabled with empty required fields', () => {
    renderStep4InLayout()

    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled()
  })

  it('toggles platform and interest chips into the store', async () => {
    render(<WizardStep4Audience />)

    await userEvent.click(screen.getByRole('button', { name: 'Instagram' }))
    await userEvent.click(screen.getByRole('button', { name: 'Belleza' }))

    expect(useCampaignWizardStore.getState().step4.platforms).toEqual([
      'instagram',
    ])
    expect(useCampaignWizardStore.getState().step4.interests).toEqual([
      'beauty',
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Instagram' }))

    expect(useCampaignWizardStore.getState().step4.platforms).toEqual([])
  })

  it('enables Continuar when all required fields are complete', () => {
    useCampaignWizardStore.setState({
      step4: {
        platforms: ['instagram'],
        interests: ['beauty'],
        creator_country: 'AR',
        min_creator_tier_slug: 'micro',
      },
    })

    renderStep4InLayout()

    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })

  it('marks step 4 completed when continuing with all required fields', async () => {
    const markStepCompleted = vi.fn()
    useCampaignWizardStore.setState({
      step4: {
        platforms: ['instagram'],
        interests: ['beauty'],
        creator_country: 'AR',
        min_creator_tier_slug: 'micro',
      },
      markStepCompleted,
    })

    renderStep4InLayout()

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(markStepCompleted).toHaveBeenCalledWith(4)
  })
})
