import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

import { RatesSection, validateRatesForm } from './RatesSection'

const { mockUpdateRates } = vi.hoisted(() => ({
  mockUpdateRates: vi.fn(),
}))

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, index) => acc + str + (values[index] ?? ''), ''),
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  getGetMyCreatorSettingsQueryKey: () => ['creator-settings'],
  useUpdateMyCreatorRates: () => ({
    mutateAsync: mockUpdateRates,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateRates.mockResolvedValue({ status: 200, data: {} })
})

describe('validateRatesForm', () => {
  it('returns must_be_positive for amount 0', () => {
    const data = creatorSettings()
    const result = validateRatesForm(
      {
        channelRates: { 'ig-1:ig_reel': '0' },
        ugcRateAmount: '',
      },
      data,
    )

    expect(result.valid).toBe(false)
    expect(result.errors.channelRates['ig-1:ig_reel']).toBe(
      'must_be_positive',
    )
  })

  it('returns must_be_positive for negative amount', () => {
    const data = creatorSettings()
    const result = validateRatesForm(
      {
        channelRates: { 'ig-1:ig_reel': '-5' },
        ugcRateAmount: '',
      },
      data,
    )

    expect(result.valid).toBe(false)
    expect(result.errors.channelRates['ig-1:ig_reel']).toBe(
      'must_be_positive',
    )
  })
})

describe('RatesSection', () => {
  it('initializes channel and UGC amount fields from settings', () => {
    renderRatesSection()

    expect(screen.getByLabelText('Reel de Instagram')).toHaveValue('120.50')
    expect(screen.getByLabelText('Video de TikTok')).toHaveValue('')
    expect(screen.getByLabelText('Tarifa UGC')).toHaveValue('300')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('renders handle and followers as text instead of editable inputs', () => {
    renderRatesSection()

    expect(screen.getByText('@ada')).toBeInTheDocument()
    expect(screen.getByText(/12,345/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Handle' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Seguidores' }),
    ).not.toBeInTheDocument()
  })

  it('shows USD next to every amount input without a currency selector', () => {
    renderRatesSection()

    expect(screen.getAllByText('USD')).toHaveLength(3)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('blocks submit when clearing a channel rate with a previous value', async () => {
    const user = userEvent.setup()
    renderRatesSection()

    await user.clear(screen.getByLabelText('Reel de Instagram'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText(
        'No se puede eliminar una tarifa declarada; ingresá un monto válido o dejá el valor anterior',
      ),
    ).toBeInTheDocument()
    expect(mockUpdateRates).not.toHaveBeenCalled()
  })

  it('blocks invalid amount values before calling the mutation', async () => {
    const user = userEvent.setup()
    renderRatesSection()

    await user.clear(screen.getByLabelText('Reel de Instagram'))
    await user.type(screen.getByLabelText('Reel de Instagram'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('must_be_positive')).toBeInTheDocument()
    expect(mockUpdateRates).not.toHaveBeenCalled()
  })

  it('saves only changed channel rates', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderRatesSection()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.clear(screen.getByLabelText('Reel de Instagram'))
    await user.type(screen.getByLabelText('Reel de Instagram'), '150')
    await user.type(screen.getByLabelText('Video de TikTok'), '80')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockUpdateRates).toHaveBeenCalledWith({
        data: {
          channel_rates: [
            { channel_id: 'ig-1', format: 'ig_reel', amount: '150' },
            { channel_id: 'tt-1', format: 'tiktok_video', amount: '80' },
          ],
        },
      })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['creator-settings'],
    })
  })

  it('sends only ugc_rate_amount when only UGC changed', async () => {
    const user = userEvent.setup()
    renderRatesSection()

    await user.clear(screen.getByLabelText('Tarifa UGC'))
    await user.type(screen.getByLabelText('Tarifa UGC'), '350')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockUpdateRates).toHaveBeenCalledWith({
        data: { ugc_rate_amount: '350' },
      })
    })
    expect(mockUpdateRates.mock.calls[0]?.[0].data.channel_rates).toBeUndefined()
  })
})

function renderRatesSection(data: CreatorSettingsResponse = creatorSettings()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const result = render(<RatesSection data={data} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return { ...result, queryClient }
}

function creatorSettings(): CreatorSettingsResponse {
  return {
    avatar_url: 'https://cdn.example.com/avatar.jpg',
    contact: {
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone_e164: '+5491123456789',
      birthday: '1990-01-01',
      country: 'AR',
      city: 'Buenos Aires',
      shipping_address: 'Calle 123',
    },
    collaboration: {
      creator_kinds: [],
      niches: [],
      content_types: [],
      languages: [],
      barter_preference: false,
    },
    channels: [
      {
        channel_id: 'ig-1',
        platform: 'instagram',
        handle: 'ada',
        external_url: 'https://instagram.com/ada',
        followers: 12345,
        rates: [{ format: 'ig_reel', amount: '120.50', currency: 'USD' }],
      },
      {
        channel_id: 'tt-1',
        platform: 'tiktok',
        handle: 'ada.tt',
        external_url: null,
        followers: null,
        rates: [],
      },
    ],
    ugc_rate: { amount: '300', currency: 'USD' },
    sample_videos: [],
  }
}
