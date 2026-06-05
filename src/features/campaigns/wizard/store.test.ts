import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCampaignWizardStore } from './store'

const originalRevokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

describe('useCampaignWizardStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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
    })
  })

  afterEach(() => {
    if (originalRevokeObjectURLDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURLDescriptor)
    } else {
      delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL
    }
  })

  it('reset revokes the image blob URL when present', () => {
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    useCampaignWizardStore
      .getState()
      .setStep3({ imageBlobUrl: 'blob:http://localhost/image' })

    useCampaignWizardStore.getState().reset()

    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/image',
    )
    expect(useCampaignWizardStore.getState().step3.imageBlobUrl).toBeNull()
  })

  it('canAccessStep allows step 1', () => {
    expect(useCampaignWizardStore.getState().canAccessStep(1)).toBe(true)
  })

  it('canAccessStep denies step 3 when step 2 is not completed', () => {
    useCampaignWizardStore.getState().markStepCompleted(1)

    expect(useCampaignWizardStore.getState().canAccessStep(3)).toBe(false)
  })

  it('canAccessStep allows step 3 when steps 1 and 2 are completed', () => {
    useCampaignWizardStore.getState().markStepCompleted(1)
    useCampaignWizardStore.getState().markStepCompleted(2)

    expect(useCampaignWizardStore.getState().canAccessStep(3)).toBe(true)
  })
})
