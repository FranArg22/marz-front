import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import type { MessageItem } from '#/features/chat/types'

import { PaymentMarkedCard } from './PaymentMarkedCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makePaymentMarkedMessage(
  payloadOverrides: Record<string, unknown> = {},
): MessageItem {
  return {
    id: 'msg-payment-1',
    conversation_id: 'conv-1',
    author_account_id: 'system',
    type: 'system_event',
    text_content: null,
    event_type: 'PaymentMarked',
    payload: {
      snapshot: {
        event_type: 'PaymentMarked',
        deliverable_id: 'del-1',
        amount: '4575.00',
        currency: 'USD',
        deliverable_display_label: 'YouTube Video',
        declared_at: '2026-05-08T12:00:00Z',
        ...payloadOverrides,
      },
    },
    created_at: '2026-05-08T12:00:00Z',
    read_by_self: false,
  }
}

describe('PaymentMarkedCard', () => {
  it('renders the outgoing sent variant for brand viewers', () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'brand' }}
      />,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders the incoming received variant for creator viewers', () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders from the self-contained snapshot without aggregate data', () => {
    const { getByText } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage({
          amount: '1200.50',
          currency: 'USD',
          deliverable_display_label: 'Instagram Reel',
          declared_at: '2026-05-09T12:00:00Z',
        })}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(getByText('Payment of $1,200.50 received')).toBeInTheDocument()
    expect(getByText(/^Instagram Reel · .*2026$/)).toBeInTheDocument()
  })
})
