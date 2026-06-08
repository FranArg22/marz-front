import { describe, expect, it } from 'vitest'

import { CAMPAIGN_WIZARD_FIELD_LIMITS } from './limits'

describe('CAMPAIGN_WIZARD_FIELD_LIMITS', () => {
  it('uses the generated CreateCampaignRequest maxLength values', () => {
    expect(CAMPAIGN_WIZARD_FIELD_LIMITS).toEqual({
      name: 150,
      description: 4000,
      target_url: 500,
    })
  })
})
