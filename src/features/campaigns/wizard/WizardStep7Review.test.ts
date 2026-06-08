import { describe, expect, it } from 'vitest'

import type { CampaignWizardState } from './store'
import { buildCreateCampaignRequest, buildReviewBlocks } from './WizardStep7Review'

describe('WizardStep7Review helpers', () => {
  it('builds 5 review blocks with steps 1 and 2 combined as campaign type', () => {
    const blocks = buildReviewBlocks(createCompleteState())

    expect(blocks).toHaveLength(5)
    expect(blocks.map((block) => block.title)).toEqual([
      'Tipo de campaña',
      'Brief',
      'Audiencia',
      'Compensación',
      'Contenido',
    ])
    expect(blocks[0]).toMatchObject({
      title: 'Tipo de campaña',
      editStep: 1,
      rows: [
        { label: 'Tipo de contenido', value: 'Influencers Posts' },
        { label: 'Modelo de pricing', value: 'Pay per post' },
      ],
    })
  })

  it('sets each review block edit destination to the expected wizard step', () => {
    const blocks = buildReviewBlocks(createCompleteState())

    expect(blocks.map((block) => [block.title, block.editStep])).toEqual([
      ['Tipo de campaña', 1],
      ['Brief', 3],
      ['Audiencia', 4],
      ['Compensación', 5],
      ['Contenido', 6],
    ])
  })

  it('builds the generated CreateCampaignRequest payload from complete state', () => {
    const request = buildCreateCampaignRequest(createCompleteState())

    expect(request).toEqual({
      content_type: 'influencer_posts',
      pricing_model: 'pay_per_post',
      name: 'Launch campaign',
      description: 'Creators introduce the new product line.',
      target_url: 'https://example.com',
      image_s3_key: 'tmp/campaigns/image.png',
      platforms: ['instagram'],
      interests: ['beauty'],
      creator_country: 'AR',
      min_creator_tier_slug: 'micro',
      compensation_type: 'payment',
      compensation_notes: null,
      video_reuse_permission_default: false,
      content_guidelines:
        'Show the product in use, mention the key benefit, and keep the tone natural.',
      brief_pdf_s3_key: null,
    })
  })

  it('returns null when the review data is incomplete', () => {
    const state = createCompleteState()
    state.step2.pricing_model = null

    expect(buildCreateCampaignRequest(state)).toBeNull()
  })
})

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
