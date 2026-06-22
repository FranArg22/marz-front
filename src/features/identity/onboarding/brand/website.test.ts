import { describe, it, expect } from 'vitest'
import { normalizeWebsiteUrl, isValidWebsiteUrl } from './website'

describe('normalizeWebsiteUrl', () => {
  it('returns empty string for blank input', () => {
    expect(normalizeWebsiteUrl('')).toBe('')
    expect(normalizeWebsiteUrl('   ')).toBe('')
  })

  it('prepends https:// when protocol is missing', () => {
    expect(normalizeWebsiteUrl('mimarca.com')).toBe('https://mimarca.com')
  })

  it('leaves links with protocol untouched (trimmed)', () => {
    expect(normalizeWebsiteUrl('  http://mimarca.com ')).toBe(
      'http://mimarca.com',
    )
  })
})

describe('isValidWebsiteUrl', () => {
  it('accepts real domains (with or without subdomain/TLD)', () => {
    expect(isValidWebsiteUrl('https://mimarca.com')).toBe(true)
    expect(isValidWebsiteUrl('https://www.mimarca.com.ar')).toBe(true)
  })

  it('rejects text that is not a domain', () => {
    expect(isValidWebsiteUrl('https://asd')).toBe(false)
    expect(isValidWebsiteUrl('https://localhost')).toBe(false)
    expect(isValidWebsiteUrl('asd')).toBe(false)
    expect(isValidWebsiteUrl('')).toBe(false)
  })
})
