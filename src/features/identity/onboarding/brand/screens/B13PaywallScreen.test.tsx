import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import type { BillingPlansResponse } from '#/shared/api/generated/model/billingPlansResponse'
import { B13PaywallScreen } from './B13PaywallScreen'

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

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router',
    )
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockGoTo = vi.fn()
const mockSetSelectedPlan = vi.fn()
const mockSetSelectedInterval = vi.fn()
const mockSetFlowChoice = vi.fn()
let storeState = {
  contact_name: 'Ana Pérez',
  selectedPlan: null as 'starter' | 'growth' | 'scale' | null,
  selectedInterval: null as 'month' | 'year' | null,
}
vi.mock('../store', () => ({
  useBrandOnboardingStore: () => ({
    ...storeState,
    goTo: mockGoTo,
    setSelectedPlan: mockSetSelectedPlan,
    setSelectedInterval: mockSetSelectedInterval,
    setFlowChoice: mockSetFlowChoice,
  }),
}))

const useBillingPlansMock = vi.fn()

vi.mock('#/features/billing/hooks/useBillingPlans', () => ({
  useBillingPlans: () => useBillingPlansMock(),
}))

const PLANS: BillingPlansResponse = {
  plans: [
    {
      plan: 'starter',
      interval: 'month',
      amount_usd: '199.00',
      stripe_price_id: 'price_starter_m',
    },
    {
      plan: 'growth',
      interval: 'month',
      amount_usd: '299.00',
      stripe_price_id: 'price_growth_m',
    },
    {
      plan: 'scale',
      interval: 'month',
      amount_usd: '999.00',
      stripe_price_id: 'price_scale_m',
    },
    {
      plan: 'starter',
      interval: 'year',
      amount_usd: '159.00',
      stripe_price_id: 'price_starter_y',
    },
  ],
}

type PlansQueryResult = UseQueryResult<{ data: BillingPlansResponse; status: 200 }>

function plansQuerySuccess(): PlansQueryResult {
  return {
    data: { data: PLANS, status: 200 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as PlansQueryResult
}

function plansQueryLoading(): PlansQueryResult {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as PlansQueryResult
}

function plansQueryError(refetch = vi.fn()): PlansQueryResult {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    refetch,
  } as unknown as PlansQueryResult
}

beforeEach(() => {
  vi.clearAllMocks()
  storeState = {
    contact_name: 'Ana Pérez',
    selectedPlan: null,
    selectedInterval: null,
  }
  useBillingPlansMock.mockReturnValue(plansQuerySuccess())
})

describe('B13PaywallScreen', () => {
  it('renders the plan cards with plan names and prices', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('Scale')).toBeInTheDocument()
    expect(screen.getByText('199')).toBeInTheDocument()
  })

  it('renders the personalized header with first name', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ana')
  })

  it('renders the trial subtitle', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText(/trial de 7 días/i)).toBeInTheDocument()
  })

  it('renders the -20% badge on the annual toggle', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText('-20%')).toBeInTheDocument()
  })

  it('sets onPlanSelect when a radio is changed', async () => {
    const user = userEvent.setup()
    render(<B13PaywallScreen />)
    await user.click(screen.getByRole('radio', { name: /growth/i }))
    expect(mockSetSelectedPlan).toHaveBeenCalledWith('growth')
  })

  it('clicking CTA on a plan card sets plan+interval+flowChoice and advances', async () => {
    const user = userEvent.setup()
    render(<B13PaywallScreen />)
    const ctaButtons = screen.getAllByRole('button', { name: /probar 7 días gratis/i })
    await user.click(ctaButtons[0]!)

    expect(mockSetSelectedPlan).toHaveBeenCalledWith('starter')
    expect(mockSetSelectedInterval).toHaveBeenCalledWith('month')
    expect(mockSetFlowChoice).toHaveBeenCalledWith('paid')
    expect(mockGoTo).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('free CTA saves free choice and advances', async () => {
    const user = userEvent.setup()
    render(<B13PaywallScreen />)
    await user.click(
      screen.getByRole('button', {
        name: /prefiero seguir sin acceso a la red de creadores/i,
      }),
    )

    expect(mockSetSelectedPlan).toHaveBeenCalledWith(null)
    expect(mockSetSelectedInterval).toHaveBeenCalledWith(null)
    expect(mockSetFlowChoice).toHaveBeenCalledWith('free')
    expect(mockGoTo).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('renders skeleton while plans are loading', () => {
    useBillingPlansMock.mockReturnValue(plansQueryLoading())
    render(<B13PaywallScreen />)
    expect(screen.getByRole('status', { name: /cargando planes/i })).toBeInTheDocument()
  })

  it('shows error UI with a retry button when plans query fails', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    useBillingPlansMock.mockReturnValue(plansQueryError(refetch))

    render(<B13PaywallScreen />)
    expect(
      screen.getByText(/no pudimos cargar los planes/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })
})
