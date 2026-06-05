import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardLayout } from './WizardLayout'
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

const originalRevokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

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

function renderWizard(onCancel = vi.fn()) {
  render(
    <WizardLayout
      step={3}
      totalSteps={7}
      onBack={() => {}}
      onCancel={onCancel}
      onNext={() => {}}
    >
      <div>Paso actual</div>
    </WizardLayout>,
  )

  return { onCancel }
}

describe('CancelWizardModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetStore()
  })

  afterEach(() => {
    if (originalRevokeObjectURLDescriptor) {
      Object.defineProperty(
        URL,
        'revokeObjectURL',
        originalRevokeObjectURLDescriptor,
      )
    } else {
      delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL
    }
  })

  it('navigates directly without opening the modal when the wizard is clean', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderWizard()

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('dialog', { name: /Salir del wizard/ }),
    ).not.toBeInTheDocument()
  })

  it('opens the modal when the wizard has edited inputs', async () => {
    const user = userEvent.setup()
    useCampaignWizardStore.getState().setStep1({
      content_type: 'influencer_posts',
    })
    const { onCancel } = renderWizard()

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(onCancel).not.toHaveBeenCalled()
    expect(
      screen.getByRole('dialog', { name: /Salir del wizard/ }),
    ).toBeInTheDocument()
  })

  it('resets the store, revokes imageBlobUrl, and navigates when choosing Salir', async () => {
    const user = userEvent.setup()
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    useCampaignWizardStore.getState().setStep3({
      name: 'Campaña con imagen',
      imageBlobUrl: 'blob:http://localhost/campaign-image',
    })
    const { onCancel } = renderWizard()

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))
    await user.click(screen.getByRole('button', { name: /^Salir$/ }))

    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/campaign-image',
    )
    expect(useCampaignWizardStore.getState().isDirty).toBe(false)
    expect(useCampaignWizardStore.getState().step3.imageBlobUrl).toBeNull()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('closes the modal and keeps the current wizard step when choosing Seguir editando', async () => {
    const user = userEvent.setup()
    useCampaignWizardStore.getState().setStep1({
      content_type: 'influencer_posts',
    })
    const { onCancel } = renderWizard()

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))
    await user.click(screen.getByRole('button', { name: /Seguir editando/ }))

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /Salir del wizard/ }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Paso actual')).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
    expect(useCampaignWizardStore.getState().isDirty).toBe(true)
  })
})
