import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
import { WizardStep2PricingModel } from './WizardStep2PricingModel'
import { useCampaignWizardStore } from './store'

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

function renderStep2InLayout(options?: {
  onNavigate?: (step: number) => void
  onBack?: () => void
}) {
  function Harness() {
    const pricingModel = useCampaignWizardStore(
      (state) => state.step2.pricing_model,
    )

    return (
      <WizardLayout
        step={2}
        totalSteps={7}
        onBack={() => options?.onBack?.()}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (store.step2.pricing_model !== null) {
            store.markStepCompleted(2)
            options?.onNavigate?.(3)
          }
        }}
        nextDisabled={pricingModel === null}
      >
        <WizardStep2PricingModel />
      </WizardLayout>
    )
  }

  return render(<Harness />)
}

describe('WizardStep2PricingModel', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows the enabled and disabled pricing model cards', () => {
    render(<WizardStep2PricingModel />)

    expect(screen.getByRole('radio', { name: /Pago fijo por publicación/ })).toBeEnabled()
    expect(
      screen.getByRole('radiogroup', { name: /Modelo de pricing/ }),
    ).toBeInTheDocument()

    const cpmCard = screen.getByRole('radio', {
      name: /CPM \(por 1000 vistas\)/,
    })
    expect(cpmCard).toBeDisabled()
    expect(cpmCard).toHaveClass('pointer-events-none', 'opacity-60')
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })

  it('does not call setStep2 when clicking the disabled CPM card', () => {
    const setStep2 = vi.fn()
    useCampaignWizardStore.setState({ setStep2 })
    render(<WizardStep2PricingModel />)

    fireEvent.click(
      screen.getByRole('radio', { name: /CPM \(por 1000 vistas\)/ }),
    )

    expect(setStep2).not.toHaveBeenCalled()
  })

  it('updates the store when selecting Pago fijo por publicación', async () => {
    render(<WizardStep2PricingModel />)

    await userEvent.click(screen.getByRole('radio', { name: /Pago fijo por publicación/ }))

    expect(useCampaignWizardStore.getState().step2).toEqual({
      pricing_model: 'pay_per_post',
    })
  })

  it('keeps Continuar disabled without a selection', () => {
    renderStep2InLayout()

    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled()
  })

  it('selecting Pago fijo por publicación checks the card and enables Continuar', async () => {
    renderStep2InLayout()

    const card = screen.getByRole('radio', { name: /Pago fijo por publicación/ })

    await userEvent.click(card)

    expect(card).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })

  it('calls markStepCompleted(2) and continues to step 3 with a selection', async () => {
    const markStepCompleted = vi.fn()
    const onNavigate = vi.fn()
    useCampaignWizardStore.setState({
      step2: { pricing_model: 'pay_per_post' },
      markStepCompleted,
    })
    renderStep2InLayout({ onNavigate })

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(markStepCompleted).toHaveBeenCalledWith(2)
    expect(onNavigate).toHaveBeenCalledWith(3)
  })

  it('goes back to step 1 without clearing the store', async () => {
    const onBack = vi.fn()
    useCampaignWizardStore.setState({
      step2: { pricing_model: 'pay_per_post' },
    })
    renderStep2InLayout({ onBack })

    await userEvent.click(screen.getByRole('button', { name: /Atrás/ }))

    expect(onBack).toHaveBeenCalledOnce()
    expect(useCampaignWizardStore.getState().step2).toEqual({
      pricing_model: 'pay_per_post',
    })
  })

  it('keeps the store selection when returning to step 2', () => {
    useCampaignWizardStore.setState({
      step2: { pricing_model: 'pay_per_post' },
    })
    renderStep2InLayout()

    expect(screen.getByRole('radio', { name: /Pago fijo por publicación/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })
})
