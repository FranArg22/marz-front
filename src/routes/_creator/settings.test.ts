import { describe, expect, it } from 'vitest'

import { settingsSearchSchema } from './settings'

describe('settingsSearchSchema', () => {
  it('defaults invalid section to general', () => {
    expect(settingsSearchSchema.parse({ section: 'invalido' }).section).toBe(
      'general',
    )
  })

  it('defaults missing section to general', () => {
    expect(settingsSearchSchema.parse({}).section).toBe('general')
  })

  it('keeps billetera section', () => {
    expect(settingsSearchSchema.parse({ section: 'billetera' }).section).toBe(
      'billetera',
    )
  })
})
