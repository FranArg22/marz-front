import { describe, expect, it } from 'vitest'

import { PayoutAccountSchema } from './PayoutAccountModal'

const validAccount = {
  account_type: 'bank',
  holder_name: 'Ada Lovelace',
  provider_name: 'Banco Marz',
  identifier: 'AR123',
  country: 'AR',
} as const

describe('PayoutAccountSchema', () => {
  it('requires holder name, provider name, identifier and country', () => {
    const result = PayoutAccountSchema.safeParse({
      ...validAccount,
      holder_name: '',
      provider_name: '',
      identifier: '',
      country: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'))
      expect(fields).toContain('holder_name')
      expect(fields).toContain('provider_name')
      expect(fields).toContain('identifier')
      expect(fields).toContain('country')
    }
  })

  it('rejects holder names over 200 characters', () => {
    const result = PayoutAccountSchema.safeParse({
      ...validAccount,
      holder_name: 'a'.repeat(201),
    })

    expect(result.success).toBe(false)
  })

  it('requires country to be exactly ISO2 length', () => {
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        country: 'A',
      }).success,
    ).toBe(false)
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        country: 'ARG',
      }).success,
    ).toBe(false)
  })
})
