import { describe, expect, it } from 'vitest'

import { computeCenterCrop, isWithin16x9Tolerance } from './imageCrop'

describe('computeCenterCrop', () => {
  it('keeps a 16:9 image intact', () => {
    expect(computeCenterCrop(1920, 1080)).toEqual({
      sx: 0,
      sy: 0,
      width: 1920,
      height: 1080,
    })
  })

  it('crops a landscape-wider image horizontally, centered', () => {
    const crop = computeCenterCrop(4000, 1080)
    expect(crop.height).toBe(1080)
    expect(crop.width).toBe(1920)
    expect(crop.sx).toBe(1040)
    expect(crop.sy).toBe(0)
  })

  it('crops a portrait image vertically, centered', () => {
    const crop = computeCenterCrop(1920, 3000)
    expect(crop.width).toBe(1920)
    expect(crop.height).toBe(1080)
    expect(crop.sx).toBe(0)
    expect(crop.sy).toBe(960)
  })

  it('never exceeds the source dimensions', () => {
    const crop = computeCenterCrop(1281, 721)
    expect(crop.width).toBeLessThanOrEqual(1281)
    expect(crop.height).toBeLessThanOrEqual(721)
  })
})

describe('isWithin16x9Tolerance', () => {
  it('accepts exact 16:9', () => {
    expect(isWithin16x9Tolerance(1920, 1080)).toBe(true)
  })

  it('accepts a ratio within the 1% tolerance', () => {
    expect(isWithin16x9Tolerance(1920, 1085)).toBe(true)
  })

  it('rejects 4:3', () => {
    expect(isWithin16x9Tolerance(1600, 1200)).toBe(false)
  })
})
