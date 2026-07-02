import { describe, expect, it } from 'vitest'

import { PayoutAccountSchema } from './PayoutAccountModal'

const validAccount = {
  name: 'Cuenta principal',
  account_holder_name: 'Ada Lovelace',
  account_number: '12345678',
  account_type: 'checking',
  routing_number: '021000021',
  address: '1 Main St, New York',
} as const

describe('PayoutAccountSchema', () => {
  it('accepts a valid ACH account', () => {
    expect(PayoutAccountSchema.safeParse(validAccount).success).toBe(true)
  })

  it('requires name, holder name, account number, type, routing number and address', () => {
    const result = PayoutAccountSchema.safeParse({
      name: '',
      account_holder_name: '',
      account_number: '',
      account_type: 'checking',
      routing_number: '',
      address: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'))
      expect(fields).toContain('name')
      expect(fields).toContain('account_holder_name')
      expect(fields).toContain('account_number')
      expect(fields).toContain('routing_number')
      expect(fields).toContain('address')
    }
  })

  it('rejects holder names over 200 characters', () => {
    const result = PayoutAccountSchema.safeParse({
      ...validAccount,
      account_holder_name: 'a'.repeat(201),
    })

    expect(result.success).toBe(false)
  })

  it('requires routing number to be exactly 9 digits', () => {
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        routing_number: '12345678',
      }).success,
    ).toBe(false)
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        routing_number: '0210000211',
      }).success,
    ).toBe(false)
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        routing_number: 'abcdefghi',
      }).success,
    ).toBe(false)
  })

  it('rejects non-numeric or too-long account numbers', () => {
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        account_number: '1234-5678',
      }).success,
    ).toBe(false)
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        account_number: '1'.repeat(18),
      }).success,
    ).toBe(false)
  })

  it('rejects unknown account types', () => {
    expect(
      PayoutAccountSchema.safeParse({
        ...validAccount,
        account_type: 'crypto',
      }).success,
    ).toBe(false)
  })

  describe('routing_number ABA checksum', () => {
    it('accepts valid ABA 021000021', () => {
      expect(
        PayoutAccountSchema.safeParse({
          ...validAccount,
          routing_number: '021000021',
        }).success,
      ).toBe(true)
    })

    it('accepts valid ABA 011000138', () => {
      expect(
        PayoutAccountSchema.safeParse({
          ...validAccount,
          routing_number: '011000138',
        }).success,
      ).toBe(true)
    })

    it('rejects invalid checksum 021000022', () => {
      expect(
        PayoutAccountSchema.safeParse({
          ...validAccount,
          routing_number: '021000022',
        }).success,
      ).toBe(false)
    })

    it('still rejects non-9-digit strings', () => {
      expect(
        PayoutAccountSchema.safeParse({
          ...validAccount,
          routing_number: '12345',
        }).success,
      ).toBe(false)
    })
  })
})
