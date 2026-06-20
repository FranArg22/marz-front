export const BUDGET_MIN_USD = 1000
export const BUDGET_MAX_USD = 50000
export const BUDGET_STEP_USD = 1000
export const BUDGET_DEFAULT_USD = 1000

const thousandsFormatter = new Intl.NumberFormat('es-AR')

/* eslint-disable lingui/no-unlocalized-strings */
export function formatBudgetFull(usd: number): string {
  return thousandsFormatter.format(usd)
}

export function formatBudgetShortK(usd: number): string {
  return `$${Math.round(usd / 1000)}K`
}
/* eslint-enable lingui/no-unlocalized-strings */
