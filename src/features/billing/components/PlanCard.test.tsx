import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { PlanCard } from './PlanCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function renderCard(overrides: Partial<Parameters<typeof PlanCard>[0]> = {}) {
  const onSelect = vi.fn()
  const utils = render(
    <div role="radiogroup" aria-label="planes">
      <PlanCard
        plan="growth"
        interval="month"
        amountUsd={299}
        selected={false}
        onSelect={onSelect}
        {...overrides}
      />
    </div>,
  )
  return { onSelect, ...utils }
}

describe('PlanCard', () => {
  it('renders price formatted as USD currency', () => {
    renderCard({ amountUsd: 299 })
    expect(screen.getByText('$299')).toBeInTheDocument()
  })

  it('invokes onSelect when clicked', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderCard()
    await user.click(screen.getByRole('radio'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('reflects selected via aria-checked', () => {
    renderCard({ selected: true })
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true')
  })

  it('is unchecked when selected is false', () => {
    renderCard({ selected: false })
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false')
  })

  it('renders highlight label when provided', () => {
    renderCard({ highlightLabel: 'RECOMENDADO' })
    expect(screen.getByText('RECOMENDADO')).toBeInTheDocument()
  })

  it('omits highlight label when not provided', () => {
    renderCard()
    expect(screen.queryByText(/RECOMENDADO/i)).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderCard({ selected: true })
    expect(await axe(container)).toHaveNoViolations()
  })
})
