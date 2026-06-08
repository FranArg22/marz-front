import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
import { WizardStep5Compensation } from './WizardStep5Compensation'
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

function renderStep5InLayout(options?: { onNavigate?: (step: number) => void }) {
  function Harness() {
    const compensationType = useCampaignWizardStore(
      (state) => state.step5.compensation_type,
    )

    return (
      <WizardLayout
        step={5}
        totalSteps={7}
        onBack={() => {}}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (store.step5.compensation_type !== null) {
            store.markStepCompleted(5)
            options?.onNavigate?.(6)
          }
        }}
        nextDisabled={compensationType === null}
      >
        <WizardStep5Compensation />
      </WizardLayout>
    )
  }

  return render(<Harness />)
}

describe('WizardStep5Compensation', () => {
  beforeEach(() => {
    resetStore()
  })

  it('selects payment on mount when the store is empty', async () => {
    render(<WizardStep5Compensation />)

    await waitFor(() => {
      expect(useCampaignWizardStore.getState().step5.compensation_type).toBe(
        'payment',
      )
    })
    expect(
      screen.getByRole('radio', { name: /Pago monetario/ }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('renders future compensation options as visually disabled', () => {
    render(<WizardStep5Compensation />)

    const productTrade = screen.getByRole('radio', {
      name: /Canje de producto/,
    })
    const paymentPlusProduct = screen.getByRole('radio', {
      name: /Pago \+ canje/,
    })

    expect(productTrade).toBeDisabled()
    expect(productTrade).toHaveClass('pointer-events-none', 'opacity-60')
    expect(paymentPlusProduct).toBeDisabled()
    expect(paymentPlusProduct).toHaveClass('pointer-events-none', 'opacity-60')
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
  })

  it('does not call setStep5 when clicking disabled options', () => {
    const setStep5 = vi.fn()
    useCampaignWizardStore.setState({
      step5: {
        compensation_type: 'payment',
        compensation_notes: '',
        video_reuse_permission_default: false,
      },
      setStep5,
    })
    render(<WizardStep5Compensation />)

    fireEvent.click(screen.getByRole('radio', { name: /Canje de producto/ }))
    fireEvent.click(screen.getByRole('radio', { name: /Pago \+ canje/ }))

    expect(setStep5).not.toHaveBeenCalled()
  })

  it('updates optional compensation notes in the store', async () => {
    render(<WizardStep5Compensation />)

    await userEvent.type(
      screen.getByLabelText('Notas de compensación'),
      'Pago a 15 días.',
    )

    expect(useCampaignWizardStore.getState().step5.compensation_notes).toBe(
      'Pago a 15 días.',
    )
  })

  it('updates video reuse permission when toggled', async () => {
    render(<WizardStep5Compensation />)

    const toggle = screen.getByRole('switch', {
      name: /Reutilización de video/,
    })

    expect(toggle).not.toBeChecked()

    await userEvent.click(toggle)

    expect(useCampaignWizardStore.getState().step5).toMatchObject({
      video_reuse_permission_default: true,
    })
    expect(toggle).toBeChecked()
  })

  it('enables Continuar in the default state', async () => {
    renderStep5InLayout()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
    })
  })

  it('marks step 5 completed and continues to step 6', async () => {
    const markStepCompleted = vi.fn()
    const onNavigate = vi.fn()
    useCampaignWizardStore.setState({
      step5: {
        compensation_type: 'payment',
        compensation_notes: '',
        video_reuse_permission_default: false,
      },
      markStepCompleted,
    })
    renderStep5InLayout({ onNavigate })

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(markStepCompleted).toHaveBeenCalledWith(5)
    expect(onNavigate).toHaveBeenCalledWith(6)
  })
})
