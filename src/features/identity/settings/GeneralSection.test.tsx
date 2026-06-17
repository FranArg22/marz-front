import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

import { GeneralSection } from './GeneralSection'

const {
  mockPresign,
  mockSetAvatar,
  mockUpdateContact,
  mockToastError,
  mockFetch,
} = vi.hoisted(() => ({
  mockPresign: vi.fn(),
  mockSetAvatar: vi.fn(),
  mockUpdateContact: vi.fn(),
  mockToastError: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, index) => acc + str + (values[index] ?? ''), ''),
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  getGetMyCreatorSettingsQueryKey: () => ['creator-settings'],
  useSetMyCreatorAvatar: () => ({
    mutateAsync: mockSetAvatar,
  }),
  useUpdateMyCreatorProfileContact: () => ({
    mutateAsync: mockUpdateContact,
  }),
}))

vi.mock('#/shared/api/generated/onboarding/onboarding', () => ({
  usePresignCreatorAvatar: () => ({
    mutateAsync: mockPresign,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPresign.mockResolvedValue({
    status: 200,
    data: {
      upload_url: 'https://s3.example.com/avatar',
      s3_key: 'avatars/new.webp',
      required_headers: { 'x-amz-meta-test': '1' },
    },
  })
  mockSetAvatar.mockResolvedValue({ status: 200, data: {} })
  mockUpdateContact.mockResolvedValue({ status: 200, data: {} })
  mockFetch.mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', mockFetch)
})

describe('GeneralSection', () => {
  it('initializes contact fields, readonly email and avatar preview', () => {
    renderGeneralSection()

    expect(screen.getByRole('textbox', { name: /Nombre completo/ })).toHaveValue(
      'Ada Lovelace',
    )
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+5491123456789')
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue(
      '1990-01-01',
    )
    expect(screen.getByLabelText('País')).toHaveValue('AR')
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Buenos Aires')
    expect(screen.getByLabelText('Dirección de envío')).toHaveValue('Calle 123')
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByAltText('Preview de avatar')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.jpg',
    )
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('selecting a valid image updates preview and makes the save bar dirty', async () => {
    renderGeneralSection()
    const input = screen.getByLabelText('Seleccionar imagen')

    fireEvent.change(input, {
      target: { files: [createFile('avatar.png', 1024, 'image/png')] },
    })

    await waitFor(() => {
      expect(screen.getByAltText('Preview de avatar')).toHaveAttribute(
        'src',
        expect.stringContaining('data:image/png'),
      )
    })
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).not.toBeDisabled()
  })

  it('rejects files larger than 5MB without changing preview', async () => {
    renderGeneralSection()

    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: {
        files: [createFile('big.png', 6 * 1024 * 1024, 'image/png')],
      },
    })

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('5MB'))
    expect(screen.getByAltText('Preview de avatar')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.jpg',
    )
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('rejects unsupported file types without changing preview', async () => {
    renderGeneralSection()

    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: { files: [createFile('avatar.gif', 1024, 'image/gif')] },
    })

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('JPEG'))
    expect(screen.getByAltText('Preview de avatar')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.jpg',
    )
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('submits avatar before contact changes', async () => {
    const calls: string[] = []
    mockPresign.mockImplementation(async () => {
      calls.push('presign')
      return {
        status: 200,
        data: {
          upload_url: 'https://s3.example.com/avatar',
          s3_key: 'avatars/new.webp',
          required_headers: {},
        },
      }
    })
    mockFetch.mockImplementation(async () => {
      calls.push('s3')
      return { ok: true }
    })
    mockSetAvatar.mockImplementation(async () => {
      calls.push('avatar')
      return { status: 200, data: {} }
    })
    mockUpdateContact.mockImplementation(async () => {
      calls.push('contact')
      return { status: 200, data: {} }
    })
    const user = userEvent.setup()
    renderGeneralSection()

    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: { files: [createFile('avatar.webp', 1024, 'image/webp')] },
    })
    await user.clear(screen.getByLabelText('Ciudad'))
    await user.type(screen.getByLabelText('Ciudad'), 'Cordoba')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(calls).toEqual(['presign', 's3', 'avatar', 'contact'])
    })
    expect(mockUpdateContact).toHaveBeenCalledWith({ data: { city: 'Cordoba' } })
  })

  it('does not patch contact when avatar presign fails and keeps the form dirty', async () => {
    mockPresign.mockRejectedValue(new Error('presign exploded'))
    const user = userEvent.setup()
    renderGeneralSection()

    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: { files: [createFile('avatar.jpg', 1024, 'image/jpeg')] },
    })
    await user.clear(screen.getByLabelText('Ciudad'))
    await user.type(screen.getByLabelText('Ciudad'), 'Rosario')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('presign exploded')).toBeInTheDocument()
    expect(mockUpdateContact).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).not.toBeDisabled()
  })

  it('shows birthday validation error on submit and does not call mutations', async () => {
    const user = userEvent.setup()
    renderGeneralSection()

    await user.clear(screen.getByLabelText('Fecha de nacimiento'))
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '2010-01-01')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText('Tenés que ser mayor de 18 años.'),
    ).toBeInTheDocument()
    expect(mockPresign).not.toHaveBeenCalled()
    expect(mockSetAvatar).not.toHaveBeenCalled()
    expect(mockUpdateContact).not.toHaveBeenCalled()
  })

  it('shows E.164 validation error on submit and does not call mutations', async () => {
    const user = userEvent.setup()
    renderGeneralSection()

    await user.clear(screen.getByLabelText('Teléfono'))
    await user.type(screen.getByLabelText('Teléfono'), '1234')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText(/Usá formato E\.164/),
    ).toBeInTheDocument()
    expect(mockPresign).not.toHaveBeenCalled()
    expect(mockSetAvatar).not.toHaveBeenCalled()
    expect(mockUpdateContact).not.toHaveBeenCalled()
  })

  it('saves only avatar when contact did not change', async () => {
    const user = userEvent.setup()
    renderGeneralSection()

    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: { files: [createFile('avatar.jpg', 1024, 'image/jpeg')] },
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).not.toBeDisabled()
    })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockSetAvatar).toHaveBeenCalledWith({
        data: { s3_key: 'avatars/new.webp' },
      })
    })
    expect(mockPresign).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockUpdateContact).not.toHaveBeenCalled()
  })

  it('saves only changed contact fields when avatar did not change', async () => {
    const user = userEvent.setup()
    renderGeneralSection()

    const fullName = screen.getByRole('textbox', { name: /Nombre completo/ })
    await user.clear(fullName)
    await user.type(fullName, 'Ada Byron')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith({
        data: { full_name: 'Ada Byron' },
      })
    })
    expect(mockPresign).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockSetAvatar).not.toHaveBeenCalled()
  })
})

function renderGeneralSection(data: CreatorSettingsResponse = creatorSettings()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(<GeneralSection data={data} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

function createFile(name: string, size: number, type: string) {
  return new File([new ArrayBuffer(size)], name, { type })
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
      barter_preference: false,
    },
    channels: [],
    ugc_rate: null,
    sample_videos: [],
  }
}
