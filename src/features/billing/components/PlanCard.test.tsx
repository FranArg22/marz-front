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

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

function renderCard(overrides: Partial<Parameters<typeof PlanCard>[0]> = {}) {
  const onSelect = vi.fn()
  const onCta = vi.fn()
  const utils = render(
    <div role="radiogroup" aria-label="planes">
      <PlanCard
        plan="growth"
        interval="month"
        amountUsd={299}
        selected={false}
        onSelect={onSelect}
        onCta={onCta}
        {...overrides}
      />
    </div>,
  )
  return { onSelect, onCta, ...utils }
}

describe('PlanCard', () => {
  it('renders price amount', () => {
    renderCard({ amountUsd: 299 })
    expect(screen.getByText('299')).toBeInTheDocument()
  })

  it('invokes onSelect when the radio input is changed', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderCard()
    await user.click(screen.getByRole('radio'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('invokes onCta when the CTA button is clicked', async () => {
    const user = userEvent.setup()
    const { onCta } = renderCard()
    await user.click(screen.getByRole('button', { name: /probar 7 días gratis/i }))
    expect(onCta).toHaveBeenCalledTimes(1)
  })

  it('reflects selected state via checked property', () => {
    renderCard({ selected: true })
    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('is unchecked when selected is false', () => {
    renderCard({ selected: false })
    expect(screen.getByRole('radio')).not.toBeChecked()
  })

  it('renders highlight label when provided', () => {
    renderCard({ highlightLabel: 'RECOMENDADO' })
    expect(screen.getByText('RECOMENDADO')).toBeInTheDocument()
  })

  it('omits highlight label when not provided', () => {
    renderCard()
    expect(screen.queryByText(/RECOMENDADO/i)).not.toBeInTheDocument()
  })

  it('renders stats section', () => {
    renderCard()
    expect(screen.getByText('CAMPAÑAS')).toBeInTheDocument()
    expect(screen.getByText('CREADORES')).toBeInTheDocument()
    expect(screen.getByText('INVITACIONES DE CONEXIÓN')).toBeInTheDocument()
  })

  it('renders INCLUYE section with feature bullets', () => {
    renderCard()
    expect(screen.getByText('INCLUYE')).toBeInTheDocument()
    expect(
      screen.getByText(/Acceso a la red de creadores/i),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderCard({ selected: true })
    expect(await axe(container)).toHaveNoViolations()
  })
})
