import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { OfferSentCard } from './OfferSentCard'
import { makeOfferSystemMessage } from './offerEventCardTestUtils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('OfferSentCard', () => {
  it('renders an OfferSnapshot v3 happy path', async () => {
    const { container } = render(
      <OfferSentCard message={makeOfferSystemMessage('OfferSent')} />,
    )

    expect(
      screen.getByRole('article', { name: 'Oferta enviada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('La marca envió una oferta.')).toBeInTheDocument()
    expect(screen.getByText('$4,575.00')).toBeInTheDocument()
    expect(screen.getByText('Instagram, TikTok')).toBeInTheDocument()
    expect(screen.getAllByText(/20/)[0]).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders when optional date and platform fields are missing', () => {
    render(
      <OfferSentCard
        message={makeOfferSystemMessage('OfferSent', {
          deadline: null,
          expires_at: null,
          deliverable: null,
          deliverables: [],
        })}
      />,
    )

    expect(screen.getAllByText('Sin fecha')).toHaveLength(2)
    expect(screen.getByText('Sin plataformas')).toBeInTheDocument()
  })
})
