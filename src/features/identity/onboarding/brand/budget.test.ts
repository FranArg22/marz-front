import { describe, expect, it } from 'vitest'
import { BUDGET_STEP_USD, budgetPercent } from './budget'

describe('budgetPercent', () => {
  it('keeps the slider selectable in 1K increments', () => {
    expect(BUDGET_STEP_USD).toBe(1000)
  })

  it('maps budget ticks to their linear slider position', () => {
    expect(budgetPercent(1000)).toBe(0)
    expect(budgetPercent(10000)).toBeCloseTo(18.37, 2)
    expect(budgetPercent(20000)).toBeCloseTo(38.78, 2)
    expect(budgetPercent(30000)).toBeCloseTo(59.18, 2)
    expect(budgetPercent(40000)).toBeCloseTo(79.59, 2)
    expect(budgetPercent(50000)).toBe(100)
  })
})
