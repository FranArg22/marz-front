import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
import { WizardStep6Content } from './WizardStep6Content'
import { useCampaignWizardStore } from './store'

vi.mock('./mutations', () => ({
  usePresignBriefPdfMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
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

function renderStep6InLayout(options?: { onNavigate?: (step: number) => void }) {
  function Harness() {
    const contentGuidelines = useCampaignWizardStore(
      (state) => state.step6.content_guidelines,
    )

    return (
      <WizardLayout
        step={6}
        totalSteps={7}
        onBack={() => {}}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (store.step6.content_guidelines.trim().length >= 50) {
            store.markStepCompleted(6)
            options?.onNavigate?.(7)
          }
        }}
        nextDisabled={contentGuidelines.trim().length < 50}
      >
        <WizardStep6Content />
      </WizardLayout>
    )
  }

  return render(<Harness />)
}

describe('WizardStep6Content', () => {
  beforeEach(() => {
    resetStore()
  })

  it('keeps Continuar disabled with 49 trimmed characters', async () => {
    renderStep6InLayout()

    await userEvent.type(
      screen.getByLabelText('Content guidelines'),
      'a'.repeat(49),
    )

    expect(screen.getByText('49/50 mínimo')).toHaveClass('text-warning')
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled()
  })

  it('enables Continuar with 50 or more trimmed characters', async () => {
    renderStep6InLayout()

    await userEvent.type(
      screen.getByLabelText('Content guidelines'),
      'a'.repeat(50),
    )

    expect(screen.getByText('50 caracteres')).toHaveClass(
      'text-muted-foreground',
    )
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })

  it('marks step 6 completed and continues to step 7', async () => {
    const markStepCompleted = vi.fn()
    const onNavigate = vi.fn()
    useCampaignWizardStore.setState({
      step6: {
        content_guidelines:
          'Estas guidelines tienen contenido suficiente para avanzar.',
        briefPdfFile: null,
        briefPdfS3Key: null,
      },
      markStepCompleted,
    })
    renderStep6InLayout({ onNavigate })

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(markStepCompleted).toHaveBeenCalledWith(6)
    expect(onNavigate).toHaveBeenCalledWith(7)
  })
})

