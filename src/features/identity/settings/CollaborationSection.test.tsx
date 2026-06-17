import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

import {
  CollaborationSection,
  CollaborationSectionSchema,
} from './CollaborationSection'

const { mockUpdateCollaboration } = vi.hoisted(() => ({
  mockUpdateCollaboration: vi.fn(),
}))

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, index) => acc + str + (values[index] ?? ''), ''),
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  getGetMyCreatorSettingsQueryKey: () => ['creator-settings'],
  useUpdateMyCreatorProfileCollaboration: () => ({
    mutateAsync: mockUpdateCollaboration,
  }),
}))

vi.mock('#/shared/api/generated/lookups/lookups', () => ({
  useListInterests: () => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'beauty', label_es: 'Belleza' },
          { slug: 'fashion', label_es: 'Moda' },
          { slug: 'fitness', label_es: 'Fitness' },
          { slug: 'food', label_es: 'Comida' },
          { slug: 'travel', label_es: 'Viajes' },
          { slug: 'tech', label_es: 'Tecnologia' },
        ],
      },
    },
  }),
  useListContentTypes: () => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'unboxing', label_es: 'Unboxing' },
          { slug: 'reviews', label_es: 'Reviews' },
          { slug: 'tutorials', label_es: 'Tutoriales' },
        ],
      },
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateCollaboration.mockResolvedValue({ status: 200, data: {} })
})

describe('CollaborationSectionSchema', () => {
  it('blocks submit with 0 creator_kinds', () => {
    const result = CollaborationSectionSchema.safeParse({
      creator_kinds: [],
      niches: ['beauty'],
      content_types: ['unboxing'],
      barter_preference: false,
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected validation to fail')
    expect(result.error.issues[0]?.message).toBe('min_1')
  })

  it('blocks submit with 6 niches and max_5 error', () => {
    const result = CollaborationSectionSchema.safeParse({
      creator_kinds: ['influencer'],
      niches: ['beauty', 'fashion', 'fitness', 'food', 'travel', 'tech'],
      content_types: ['unboxing'],
      barter_preference: false,
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected validation to fail')
    expect(result.error.issues[0]?.message).toBe('max_5')
  })

  it('blocks submit with 0 content_types and min_1 error', () => {
    const result = CollaborationSectionSchema.safeParse({
      creator_kinds: ['influencer'],
      niches: ['beauty'],
      content_types: [],
      barter_preference: false,
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected validation to fail')
    expect(result.error.issues[0]?.message).toBe('min_1')
  })
})

describe('CollaborationSection', () => {
  it('initializes from collaboration data and keeps save disabled without changes', () => {
    renderCollaborationSection()

    expect(screen.getByRole('checkbox', { name: 'Influencer' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('checkbox', { name: 'Belleza' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('checkbox', { name: 'Unboxing' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('switch', { name: 'Acepto canjes' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('disables the only selected creator kind with a visible explanation', () => {
    renderCollaborationSection()

    expect(screen.getByRole('checkbox', { name: 'Influencer' })).toBeDisabled()
    expect(screen.getByText('Debe seleccionar al menos uno')).toBeInTheDocument()
  })

  it('disables selecting a sixth niche', () => {
    renderCollaborationSection(
      creatorSettings({
        niches: ['beauty', 'fashion', 'fitness', 'food', 'travel'],
      }),
    )

    expect(screen.getByRole('checkbox', { name: 'Tecnologia' })).toBeDisabled()
  })

  it('disables removing the last niche and content type', () => {
    renderCollaborationSection()

    expect(screen.getByRole('checkbox', { name: 'Belleza' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Unboxing' })).toBeDisabled()
  })

  it('saves valid collaboration changes and invalidates creator settings', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderCollaborationSection()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('checkbox', { name: 'UGC' }))
    await user.click(screen.getByRole('checkbox', { name: 'Moda' }))
    await user.click(screen.getByRole('checkbox', { name: 'Reviews' }))
    await user.click(screen.getByRole('switch', { name: 'Acepto canjes' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockUpdateCollaboration).toHaveBeenCalledWith({
        data: {
          creator_kinds: ['influencer', 'ugc'],
          niches: ['beauty', 'fashion'],
          content_types: ['unboxing', 'reviews'],
          barter_preference: false,
        },
      })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['creator-settings'],
    })
  })
})

function renderCollaborationSection(
  data: CreatorSettingsResponse = creatorSettings(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const result = render(<CollaborationSection data={data} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return { ...result, queryClient }
}

function creatorSettings(
  collaboration: Partial<CreatorSettingsResponse['collaboration']> = {},
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
      creator_kinds: ['influencer'],
      niches: ['beauty'],
      content_types: ['unboxing'],
      barter_preference: true,
      ...collaboration,
    },
    channels: [],
    ugc_rate: null,
    sample_videos: [],
  }
}
