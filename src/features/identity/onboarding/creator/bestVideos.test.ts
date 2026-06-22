import { describe, it, expect } from 'vitest'
import { normalizeVideoUrl, isValidVideoUrl } from './bestVideos'

describe('normalizeVideoUrl', () => {
  it('returns empty string for blank input', () => {
    expect(normalizeVideoUrl('')).toBe('')
    expect(normalizeVideoUrl('   ')).toBe('')
  })

  it('prepends https:// when protocol is missing', () => {
    expect(normalizeVideoUrl('instagram.com/reel/x')).toBe(
      'https://instagram.com/reel/x',
    )
  })

  it('leaves links with protocol untouched (trimmed)', () => {
    expect(normalizeVideoUrl('  https://youtube.com/shorts/x ')).toBe(
      'https://youtube.com/shorts/x',
    )
    expect(normalizeVideoUrl('http://tiktok.com/@u/video/1')).toBe(
      'http://tiktok.com/@u/video/1',
    )
  })
})

describe('isValidVideoUrl', () => {
  it('accepts valid URLs', () => {
    expect(isValidVideoUrl('https://instagram.com/reel/x')).toBe(true)
  })

  it('rejects non-URL text', () => {
    expect(isValidVideoUrl('no es un link')).toBe(false)
    expect(isValidVideoUrl('')).toBe(false)
  })
})
