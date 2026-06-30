import { describe, it, expect } from 'vitest'
import { STEPS, getStepIndex, getStepId } from './steps'
import type { CreatorOnboardingState } from './store'
import type { CreatorChannel } from './types'

function makeState(
  partial: Partial<CreatorOnboardingState> = {},
): CreatorOnboardingState {
  return {
    currentStepIndex: 0,
    fieldErrors: {},
    setField: () => {},
    setFieldErrors: () => {},
    clearFieldErrors: () => {},
    prefillFrom: () => {},
    goTo: () => {},
    reset: () => {},
    ...partial,
  }
}

describe('STEPS', () => {
  it('has 22 steps', () => {
    expect(STEPS).toHaveLength(22)
  })

  it('every step has id and component', () => {
    for (const step of STEPS) {
      expect(typeof step.id).toBe('string')
      expect(step.id.length).toBeGreaterThan(0)
      expect(typeof step.component).toBe('function')
    }
  })

  it('has unique ids', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getStepIndex', () => {
  it('returns correct index for valid ids', () => {
    expect(getStepIndex('name-handle')).toBe(0)
    expect(getStepIndex('experience')).toBe(1)
    expect(getStepIndex('languages')).toBe(6)
    expect(getStepIndex('barter')).toBe(7)
    expect(getStepIndex('confirmation')).toBe(21)
  })

  it('returns -1 for unknown id', () => {
    expect(getStepIndex('foobar')).toBe(-1)
    expect(getStepIndex('')).toBe(-1)
  })
})

describe('getStepId', () => {
  it('returns correct id for valid indices', () => {
    expect(getStepId(0)).toBe('name-handle')
    expect(getStepId(21)).toBe('confirmation')
  })

  it('clamps out-of-range indices', () => {
    expect(getStepId(-5)).toBe('name-handle')
    expect(getStepId(100)).toBe('confirmation')
  })
})

describe('validate functions', () => {
  it('C1 name-handle: requires non-empty display_name', () => {
    const validate = STEPS[0]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ display_name: '' }))).toBe(false)
    expect(validate(makeState({ display_name: '   ' }))).toBe(false)
    expect(validate(makeState({ display_name: 'Ana' }))).toBe(true)
  })

  it('C2 experience: requires non-empty experience_level', () => {
    const validate = STEPS[1]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ experience_level: 'none' }))).toBe(true)
  })

  it('C3 priming-brands-waiting: no validation', () => {
    expect(STEPS[2]!.validate).toBeUndefined()
  })

  it('C4 tier: requires non-empty tier', () => {
    const validate = STEPS[3]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ tier: 'micro' }))).toBe(true)
  })

  it('C5 niches: requires 1-5 niches', () => {
    const validate = STEPS[4]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ niches: [] }))).toBe(false)
    expect(validate(makeState({ niches: ['fitness'] }))).toBe(true)
    expect(validate(makeState({ niches: ['a', 'b', 'c', 'd', 'e'] }))).toBe(
      true,
    )
    expect(
      validate(makeState({ niches: ['a', 'b', 'c', 'd', 'e', 'f'] })),
    ).toBe(false)
  })

  it('C6 content-types: requires at least 1', () => {
    const validate = STEPS[5]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ content_types: [] }))).toBe(false)
    expect(validate(makeState({ content_types: ['reels'] }))).toBe(true)
  })

  it('C6b languages: requires at least 1', () => {
    const validate = STEPS[6]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ languages: [] }))).toBe(false)
    expect(validate(makeState({ languages: ['es'] }))).toBe(true)
    expect(validate(makeState({ languages: ['es', 'en'] }))).toBe(true)
  })

  it('C6c barter: requires an explicit yes/no', () => {
    const validate = STEPS[getStepIndex('barter')]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ barter_preference: false }))).toBe(true)
    expect(validate(makeState({ barter_preference: true }))).toBe(true)
  })

  it('C7 channels: requires >= 1 channel with exactly 1 primary', () => {
    const validate = STEPS[8]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ channels: [] }))).toBe(false)
    const ch: CreatorChannel = {
      platform: 'instagram',
      external_handle: '@test',
      verified: false,
      is_primary: true,
      rate_cards: [
        { format: 'ig_reel', rate_amount: '100', rate_currency: 'USD' },
      ],
    }
    expect(validate(makeState({ channels: [ch] }))).toBe(true)
    // A channel without any rate card cannot pass.
    expect(
      validate(makeState({ channels: [{ ...ch, rate_cards: [] }] })),
    ).toBe(false)
    // A rate card without an amount cannot pass.
    expect(
      validate(
        makeState({
          channels: [
            {
              ...ch,
              rate_cards: [
                { format: 'ig_reel', rate_amount: '', rate_currency: 'USD' },
              ],
            },
          ],
        }),
      ),
    ).toBe(false)
    expect(
      validate(
        makeState({
          channels: [ch, { ...ch, is_primary: true }],
        }),
      ),
    ).toBe(false)
  })

  it('C7b ugc: requires a positive rate only when UGC is selected', () => {
    const validate = STEPS[getStepIndex('ugc')]!.validate!
    // Not answered / not doing UGC: always valid.
    expect(validate(makeState())).toBe(true)
    expect(validate(makeState({ creator_kinds: ['influencer'] }))).toBe(true)
    // Says yes to UGC but no rate: blocked.
    expect(
      validate(makeState({ creator_kinds: ['influencer', 'ugc'] })),
    ).toBe(false)
    expect(
      validate(
        makeState({ creator_kinds: ['influencer', 'ugc'], ugc_rate_amount: '' }),
      ),
    ).toBe(false)
    expect(
      validate(
        makeState({
          creator_kinds: ['influencer', 'ugc'],
          ugc_rate_amount: '0',
        }),
      ),
    ).toBe(false)
    // Says yes with a positive rate: valid.
    expect(
      validate(
        makeState({
          creator_kinds: ['influencer', 'ugc'],
          ugc_rate_amount: '50',
        }),
      ),
    ).toBe(true)
  })

  it('primings: no validation', () => {
    expect(STEPS[getStepIndex('priming-testimonials')]!.validate).toBeUndefined()
    expect(STEPS[getStepIndex('priming-benchmark')]!.validate).toBeUndefined()
  })

  it('C10 best-videos: optional but rejects malformed links', () => {
    const validate = STEPS[getStepIndex('best-videos')]!.validate!
    expect(validate(makeState())).toBe(true)
    expect(
      validate(
        makeState({
          best_videos: [{ url: '' }, { url: '' }, { url: '' }],
        }),
      ),
    ).toBe(true)
    expect(
      validate(makeState({ best_videos: [{ url: 'instagram.com/reel/x' }] })),
    ).toBe(true)
    expect(
      validate(makeState({ best_videos: [{ url: 'no es un link' }] })),
    ).toBe(false)
  })

  it('C11 birthday: requires YYYY-MM-DD format and at least 18 years old', () => {
    const validate = STEPS[getStepIndex('birthday')]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ birthday: '2000-01-01' }))).toBe(true)
    expect(validate(makeState({ birthday: '01/01/2000' }))).toBe(false)
    expect(validate(makeState({ birthday: '2015-01-01' }))).toBe(false)
  })

  it('C12 gender: no validation (optional)', () => {
    expect(STEPS[getStepIndex('gender')]!.validate).toBeUndefined()
  })

  it('C13 location: requires 2-letter country code', () => {
    const validate = STEPS[getStepIndex('location')]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ country: 'AR' }))).toBe(true)
    expect(validate(makeState({ country: 'arg' }))).toBe(false)
  })

  it('C15 whatsapp: requires a valid phone number', () => {
    const validate = STEPS[getStepIndex('whatsapp')]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ whatsapp_e164: '+5491155550000' }))).toBe(true)
    expect(validate(makeState({ whatsapp_e164: '12345' }))).toBe(false)
    expect(validate(makeState({ whatsapp_e164: '' }))).toBe(false)
  })

  it('C16 referral: no validation (optional)', () => {
    expect(STEPS[getStepIndex('referral')]!.validate).toBeUndefined()
  })

  it('C17 avatar: requires non-empty avatar_s3_key', () => {
    const validate = STEPS[getStepIndex('avatar')]!.validate!
    expect(validate(makeState())).toBe(false)
    expect(validate(makeState({ avatar_s3_key: '' }))).toBe(false)
    expect(validate(makeState({ avatar_s3_key: 'avatars/123.jpg' }))).toBe(true)
  })

  it('C18 priming-earnings: no validation', () => {
    expect(STEPS[getStepIndex('priming-earnings')]!.validate).toBeUndefined()
  })

  it('C19 priming-social-proof: no validation', () => {
    expect(
      STEPS[getStepIndex('priming-social-proof')]!.validate,
    ).toBeUndefined()
  })

  it('C20 confirmation: no validation', () => {
    expect(STEPS[getStepIndex('confirmation')]!.validate).toBeUndefined()
  })
})
