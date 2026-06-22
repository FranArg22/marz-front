import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

import { PortfolioSection } from './PortfolioSection'

const { mockReplaceSampleVideos } = vi.hoisted(() => ({
  mockReplaceSampleVideos: vi.fn(),
}))

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, index) => acc + str + (values[index] ?? ''), ''),
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  getGetMyCreatorSettingsQueryKey: () => ['creator-settings'],
  useReplaceMyCreatorSampleVideos: () => ({
    mutateAsync: mockReplaceSampleVideos,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockReplaceSampleVideos.mockResolvedValue({ status: 200, data: {} })
})

describe('PortfolioSection', () => {
  it('renders exactly 3 slots with existing URLs and pending empty slots', () => {
    renderPortfolioSection(
      creatorSettings({
        sample_videos: [{ url: 'https://videos.example.com/one' }],
      }),
    )

    expect(screen.getByText('Video 1')).toBeInTheDocument()
    expect(screen.getByText('Video 2')).toBeInTheDocument()
    expect(screen.getByText('Video 3')).toBeInTheDocument()
    expect(
      screen.getByText('https://videos.example.com/one'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente')).toHaveLength(2)
    expect(screen.getAllByLabelText(/^URL del video/)).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it("blocks invalid URL submit and doesn't call the mutation", async () => {
    const user = userEvent.setup()
    renderPortfolioSection()

    await user.type(screen.getAllByLabelText(/^URL del video/)[0]!, 'not-a-url')

    expect(
      screen.getByText('Ingresá una URL válida que empiece con http:// o https://'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    await user.keyboard('{Enter}')

    expect(mockReplaceSampleVideos).not.toHaveBeenCalled()
  })

  it('saves a valid URL entered in an empty slot', async () => {
    const user = userEvent.setup()
    renderPortfolioSection()

    await user.type(
      screen.getAllByLabelText(/^URL del video/)[0]!,
      'https://videos.example.com/new',
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockReplaceSampleVideos).toHaveBeenCalledWith({
        data: { videos: [{ url: 'https://videos.example.com/new' }] },
      })
    })
  })

  it('saves three empty slots as an empty videos array', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderPortfolioSection(
      creatorSettings({
        sample_videos: [{ url: 'https://videos.example.com/one' }],
      }),
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: 'Quitar link' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockReplaceSampleVideos).toHaveBeenCalledWith({
        data: { videos: [] },
      })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['creator-settings'],
    })
  })

  it('removing slot 1 from 3 URLs saves slots 0 and 2 in order', async () => {
    const user = userEvent.setup()
    renderPortfolioSection(
      creatorSettings({
        sample_videos: [
          { url: 'https://videos.example.com/zero' },
          { url: 'https://videos.example.com/one' },
          { url: 'https://videos.example.com/two' },
        ],
      }),
    )

    await user.click(screen.getAllByRole('button', { name: 'Quitar link' })[1]!)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockReplaceSampleVideos).toHaveBeenCalledWith({
        data: {
          videos: [
            { url: 'https://videos.example.com/zero' },
            { url: 'https://videos.example.com/two' },
          ],
        },
      })
    })
  })
})

function renderPortfolioSection(
  data: CreatorSettingsResponse = creatorSettings(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const result = render(<PortfolioSection data={data} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return { ...result, queryClient }
}

function creatorSettings(
  overrides: Partial<CreatorSettingsResponse> = {},
): CreatorSettingsResponse {
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
    channels: [],
    ugc_rate: null,
    sample_videos: [],
    ...overrides,
  }
}
