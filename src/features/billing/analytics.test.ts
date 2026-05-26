import { describe, it, expect } from 'vitest'
import { trackBillingEvent } from './analytics'

describe('trackBillingEvent', () => {
  it('does not throw when called with a valid event', () => {
    expect(() =>
      trackBillingEvent('offers_payment_method_viewed'),
    ).not.toThrow()
  })

  it('does not throw with an optional payload', () => {
    expect(() =>
      trackBillingEvent('offers_payment_method_portal_opened', { source: 'card' }),
    ).not.toThrow()
  })
})
