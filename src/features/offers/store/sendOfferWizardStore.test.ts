import { beforeEach, describe, expect, it } from 'vitest'

import { useSendOfferWizard } from './sendOfferWizardStore'

describe('useSendOfferWizard', () => {
  beforeEach(() => {
    useSendOfferWizard.getState().reset()
  })

  it('preserves both content snapshots when toggling mode', () => {
    useSendOfferWizard.getState().patchSameContent({
      campaign_id: 'campaign-1',
      amount: 1000,
    })
    useSendOfferWizard.getState().setMode('per_platform')
    useSendOfferWizard.getState().patchPerPlatform({
      campaign_id: 'campaign-2',
      amount: 2000,
    })
    useSendOfferWizard.getState().setMode('same_content')

    const state = useSendOfferWizard.getState()
    expect(state.mode).toBe('same_content')
    expect(state.sameContent).toEqual({
      campaign_id: 'campaign-1',
      amount: 1000,
    })
    expect(state.perPlatform).toEqual({
      campaign_id: 'campaign-2',
      amount: 2000,
    })
  })

  it('resets to the initial state', () => {
    useSendOfferWizard.getState().setMode('per_platform')
    useSendOfferWizard.getState().patchSameContent({
      campaign_id: 'campaign-1',
      amount: 1000,
    })
    useSendOfferWizard.getState().patchPerPlatform({
      campaign_id: 'campaign-2',
      amount: 2000,
    })
    useSendOfferWizard.getState().setBonusesEnabledGlobal(true)
    useSendOfferWizard.getState().setBonusesSnapshot({
      enabled: true,
      speed_bonus_windows: [
        {
          window_hours: 24,
          bonus_amount: { type: 'percentage', value: 10 },
        },
      ],
    })

    useSendOfferWizard.getState().reset()

    expect(useSendOfferWizard.getState()).toMatchObject({
      mode: 'same_content',
      sameContent: {},
      perPlatform: {},
      bonusesEnabledGlobal: false,
      bonusesSnapshot: null,
    })
  })
})
