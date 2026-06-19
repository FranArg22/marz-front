import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
import { WizardStep1ContentType } from './WizardStep1ContentType'
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

function renderStep1InLayout() {
  function Harness() {
    const contentType = useCampaignWizardStore(
      (state) => state.step1.content_type,
    )

    return (
      <WizardLayout
        step={1}
        totalSteps={7}
        onBack={() => {}}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (store.step1.content_type !== null) {
            store.markStepCompleted(1)
          }
        }}
        nextDisabled={contentType === null}
      >
        <WizardStep1ContentType />
      </WizardLayout>
    )
  }

  return render(<Harness />)
}

function renderStep1RouteHarness(onNavigate: (step: number) => void) {
  function Harness() {
    const contentType = useCampaignWizardStore(
      (state) => state.step1.content_type,
    )

    return (
      <WizardLayout
        step={1}
        totalSteps={7}
        onBack={() => {}}
        onCancel={() => {}}
        onNext={() => {
          const store = useCampaignWizardStore.getState()
          if (store.step1.content_type !== null) {
            store.markStepCompleted(1)
            onNavigate(2)
          }
        }}
        nextDisabled={contentType === null}
      >
        <WizardStep1ContentType />
      </WizardLayout>
    )
  }

  render(<Harness />)
}

function renderStep2Layout(onBack: () => void) {
  render(
    <WizardLayout
      step={2}
      totalSteps={7}
      onBack={onBack}
      onCancel={() => {}}
      onNext={() => {}}
    >
      <div>Step 2</div>
    </WizardLayout>,
  )
}

describe('WizardStep1ContentType', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows the enabled and disabled content type cards', () => {
    render(<WizardStep1ContentType />)

    expect(
      screen.getByRole('radio', { name: /Publicaciones de influencers/ }),
    ).toBeEnabled()
    expect(
      screen.getByRole('radiogroup', { name: /Tipo de contenido/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /UGC Videos/ })).toBeDisabled()
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })

  it('does not call setStep1 when clicking the disabled UGC card', async () => {
    const setStep1 = vi.fn()
    useCampaignWizardStore.setState({ setStep1 })
    render(<WizardStep1ContentType />)

    await userEvent.click(screen.getByRole('radio', { name: /UGC Videos/ }))

    expect(setStep1).not.toHaveBeenCalled()
  })

  it('updates the store when selecting Publicaciones de influencers', async () => {
    render(<WizardStep1ContentType />)

    await userEvent.click(
      screen.getByRole('radio', { name: /Publicaciones de influencers/ }),
    )

    expect(useCampaignWizardStore.getState().step1).toEqual({
      content_type: 'influencer_posts',
    })
  })

  it('keeps Continuar disabled without a selection', () => {
    renderStep1InLayout()

    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled()
  })

  it('selecting Publicaciones de influencers checks the card and enables Continuar', async () => {
    renderStep1InLayout()

    const card = screen.getByRole('radio', { name: /Publicaciones de influencers/ })

    await userEvent.click(card)

    expect(card).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })

  it('calls markStepCompleted(1) when continuing with a selection', async () => {
    const markStepCompleted = vi.fn()
    useCampaignWizardStore.setState({
      step1: { content_type: 'influencer_posts' },
      markStepCompleted,
    })
    renderStep1InLayout()

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(markStepCompleted).toHaveBeenCalledWith(1)
  })

  it('continues to step 2 after selecting the enabled card', async () => {
    const onNavigate = vi.fn()
    renderStep1RouteHarness(onNavigate)

    await userEvent.click(
      screen.getByRole('radio', { name: /Publicaciones de influencers/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('disables Atrás on step 1 and enables it on later steps', async () => {
    const onBack = vi.fn()
    const { unmount } = renderStep1InLayout()

    expect(screen.getByRole('button', { name: /Atrás/ })).toBeDisabled()

    unmount()
    resetStore()
    renderStep2Layout(onBack)
    await userEvent.click(screen.getByRole('button', { name: /Atrás/ }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})
