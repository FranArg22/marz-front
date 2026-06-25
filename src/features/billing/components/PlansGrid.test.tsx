import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import type { BillingPlan } from '#/shared/api/generated/model/billingPlan'
import { PlansGrid } from './PlansGrid'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

const ALL_PLANS: BillingPlan[] = [
  { plan: 'starter', interval: 'month', amount_usd: '199.00', stripe_price_id: 'price_starter_m' },
  { plan: 'growth', interval: 'month', amount_usd: '299.00', stripe_price_id: 'price_growth_m' },
  { plan: 'scale', interval: 'month', amount_usd: '999.00', stripe_price_id: 'price_scale_m' },
  { plan: 'starter', interval: 'year', amount_usd: '159.00', stripe_price_id: 'price_starter_y' },
  { plan: 'growth', interval: 'year', amount_usd: '239.00', stripe_price_id: 'price_growth_y' },
  { plan: 'scale', interval: 'year', amount_usd: '799.00', stripe_price_id: 'price_scale_y' },
]

function setup(overrides: Partial<Parameters<typeof PlansGrid>[0]> = {}) {
  const onPlanSelect = vi.fn()
  const onIntervalChange = vi.fn()
  const onPlanCta = vi.fn()
  const utils = render(
    <PlansGrid
      plans={ALL_PLANS}
      selectedInterval="month"
      onIntervalChange={onIntervalChange}
      onPlanSelect={onPlanSelect}
      onPlanCta={onPlanCta}
      {...overrides}
    />,
  )
  return { onPlanSelect, onIntervalChange, onPlanCta, ...utils }
}

describe('PlansGrid', () => {
  it('shows 3 cards for selected month interval and hides year cards', () => {
    setup({ selectedInterval: 'month' })
    const group = screen.getByRole('radiogroup', { name: /planes/i })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByText('199')).toBeInTheDocument()
    expect(screen.queryByText('159')).not.toBeInTheDocument()
  })

  it('shows year cards when selectedInterval is year', () => {
    setup({ selectedInterval: 'year' })
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.queryByText('199')).not.toBeInTheDocument()
  })

  it('invokes onIntervalChange when toggling annual tab', async () => {
    const user = userEvent.setup()
    const { onIntervalChange } = setup({ selectedInterval: 'month' })
    await user.click(screen.getByRole('tab', { name: /anual/i }))
    expect(onIntervalChange).toHaveBeenCalledWith('year')
  })

  it('invokes onPlanSelect with plan id when a radio is changed', async () => {
    const user = userEvent.setup()
    const { onPlanSelect } = setup({ selectedInterval: 'month' })
    await user.click(screen.getByRole('radio', { name: /growth/i }))
    expect(onPlanSelect).toHaveBeenCalledWith('growth')
  })

  it('invokes onPlanCta when CTA button inside a card is clicked', async () => {
    const user = userEvent.setup()
    const { onPlanCta } = setup({ selectedInterval: 'month' })
    const ctaButtons = screen.getAllByRole('button', { name: /probar 7 días gratis/i })
    await user.click(ctaButtons[0]!)
    expect(onPlanCta).toHaveBeenCalledWith('starter')
  })

  it('renders no selected card when selectedPlan is undefined', () => {
    setup({ selectedInterval: 'month', selectedPlan: undefined })
    const group = screen.getByRole('radiogroup', { name: /planes/i })
    for (const radio of within(group).getAllByRole('radio')) {
      expect(radio).not.toBeChecked()
    }
  })

  it('marks the selected plan card as checked', () => {
    setup({ selectedInterval: 'month', selectedPlan: 'scale' })
    const scaleInput = screen.getByRole('radio', { name: /scale/i })
    expect(scaleInput).toBeChecked()
  })

  it('shows the discount badge on the annual tab', () => {
    setup({ selectedInterval: 'month' })
    expect(screen.getByText('· 20% off')).toBeInTheDocument()
  })

  it('shows "Recomendado para vos" badge on the growth card', () => {
    setup({ selectedInterval: 'month' })
    expect(screen.getByText('Recomendado para vos')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = setup()
    expect(await axe(container)).toHaveNoViolations()
  })
})
