import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferExpiredCard } from './OfferExpiredCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferExpiredCard', () => {
  it('renders an OfferSnapshot v3 happy path', async () => {
    const { container } = render(
      <OfferExpiredCard
        message={makeOfferSystemMessage('OfferExpired', {
          status: 'expired',
          expired_at: '2026-05-20T12:00:00Z',
        })}
      />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta vencida' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/La oferta venció el/)).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders when expired_at is missing', () => {
    render(
      <OfferExpiredCard
        message={makeOfferSystemMessage('OfferExpired', {
          status: 'expired',
        })}
      />,
    )

    expect(screen.getByText('La oferta venció.')).toBeInTheDocument()
  })
})
