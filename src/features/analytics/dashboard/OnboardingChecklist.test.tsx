import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MouseEvent, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OnboardingChecklistItem } from '#/shared/api/generated/model/onboardingChecklistItem'
import type { OnboardingChecklistItemKey } from '#/shared/api/generated/model/onboardingChecklistItemKey'
import type { OnboardingChecklistResponse } from '#/shared/api/generated/model/onboardingChecklistResponse'

import { OnboardingChecklist } from './OnboardingChecklist'

const linkMock = vi.hoisted(() => ({ navigatedTo: '' }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    onClick,
    ...props
  }: {
    children: ReactNode
    to: string
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault()
        linkMock.navigatedTo = to
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </a>
  ),
}))

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    linkMock.navigatedTo = ''
  })

  it('renders nothing when completed=true', () => {
    const { container } = renderChecklist({
      data: {
        completed: true,
        progress: { done: 6, total: 6 },
      },
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('checklist')).not.toBeInTheDocument()
  })

  it('renders six pending items and a 0% progress bar when done=0', () => {
    renderChecklist({
      data: makeResponse(0),
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.queryAllByTestId('checklist-check-done')).toHaveLength(0)
    expect(screen.getAllByTestId('checklist-check-pending')).toHaveLength(6)
    expect(screen.getByTestId('checklist-progress-bar')).toHaveStyle({
      width: '0%',
    })
  })

  it('renders three completed items, three pending items, and a 50% progress bar when done=3', () => {
    renderChecklist({
      data: makeResponse(3),
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getAllByTestId('checklist-check-done')).toHaveLength(3)
    expect(screen.getAllByTestId('checklist-check-pending')).toHaveLength(3)
    expect(screen.getByTestId('checklist-progress-bar')).toHaveStyle({
      width: '50%',
    })
  })

  it('caps the progress bar at 100% when done=6 and completed=false', () => {
    renderChecklist({
      data: makeResponse(6),
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getByTestId('checklist-progress-bar')).toHaveStyle({
      width: '100%',
    })
  })

  it('renders the loading skeleton', () => {
    renderChecklist({
      data: undefined,
      isLoading: true,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getByTestId('checklist-skeleton')).toBeInTheDocument()
  })

  it('navigates to the backend cta_route when a CTA is clicked', async () => {
    const user = userEvent.setup()
    renderChecklist({
      data: makeResponse(0),
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    await user.click(
      screen.getByRole('link', { name: 'Ir a complete_brand_profile' }),
    )

    expect(linkMock.navigatedTo).toBe('/ajustes/general')
  })
})

function renderChecklist(props: Parameters<typeof OnboardingChecklist>[0]) {
  return render(<OnboardingChecklist {...props} />)
}

function makeResponse(doneCount: number): OnboardingChecklistResponse {
  return {
    completed: false,
    progress: { done: doneCount, total: 6 },
    items: KEYS.map((key, index) => makeItem(key, index < doneCount)),
  }
}

function makeItem(
  key: OnboardingChecklistItemKey,
  done: boolean,
): OnboardingChecklistItem {
  return {
    key,
    done,
    label: `Item ${key}`,
    cta_label: `Ir a ${key}`,
    cta_route:
      key === 'complete_brand_profile' ? '/ajustes/general' : '/campaigns/new',
  }
}

const KEYS: OnboardingChecklistItemKey[] = [
  'complete_brand_profile',
  'create_first_campaign',
  'invite_first_creator',
  'send_first_offer',
  'approve_first_draft',
  'complete_first_collaboration',
]
