import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '#/shared/api/mutator'
import { GeneralSection } from './GeneralSection'

const patchMock = vi.hoisted(() => vi.fn())
const invalidateQueriesMock = vi.hoisted(() => vi.fn())
const logoUploaderMock = vi.hoisted(() => vi.fn())
const logoUploaderState = vi.hoisted(() => ({ uploadFails: false }))

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>(
      '@tanstack/react-query',
    )
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

vi.mock('#/shared/api/generated/identity/identity', () => ({
  getGetBrandSettingsQueryKey: () => ['/v1/brand-workspaces/me/settings'],
  useGetBrandSettings: () => ({
    data: {
      status: 200,
      data: {
        profile: {
          full_name: 'Rafa Tester',
          email: 'rafa@example.com',
          phone_e164: '+5491112345678',
        },
        brand: {
          name: 'Marz',
          website_url: 'https://marz.example',
          logo_url: 'https://cdn.example/logo.png',
        },
      },
    },
    isLoading: false,
    isError: false,
  }),
  usePatchBrandSettings: () => ({
    mutateAsync: patchMock,
    isPending: false,
  }),
}))

vi.mock('./LogoUploader', () => ({
  LogoUploader: (props: {
    currentLogoUrl: string | null
    onKeyChange: (key: string | null) => void
  }) => {
    logoUploaderMock(props)
    return (
      <button
        type="button"
        onClick={() => {
          if (!logoUploaderState.uploadFails) {
            props.onKeyChange('brand-logos/ws/logo.webp')
          }
        }}
      >
        Cambiar logo
      </button>
    )
  },
}))

function renderSection() {
  return render(<GeneralSection />)
}

function getInput(name: string) {
  const input = document.querySelector(`input[name="${name}"]`)
  expect(input).toBeInstanceOf(HTMLInputElement)
  return input as HTMLInputElement
}

describe('GeneralSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logoUploaderState.uploadFails = false
    patchMock.mockResolvedValue({
      status: 200,
      data: {
        profile: {
          full_name: 'Rafa Dev',
          email: 'rafa@example.com',
          phone_e164: '+5491199999999',
        },
        brand: {
          name: 'Marz Labs',
          website_url: 'https://labs.example',
          logo_url: null,
        },
      },
      headers: new Headers(),
    })
  })

  it('submit con campos válidos llama patch con los diffs', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.clear(getInput('full_name'))
    await user.type(getInput('full_name'), 'Rafa Dev')
    await user.clear(getInput('name'))
    await user.type(getInput('name'), 'Marz Labs')
    await user.clear(getInput('website_url'))
    await user.type(getInput('website_url'), 'https://labs.example')
    await user.clear(getInput('phone_e164'))
    await user.type(getInput('phone_e164'), '+5491199999999')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith({
        data: {
          full_name: 'Rafa Dev',
          phone_e164: '+5491199999999',
          name: 'Marz Labs',
          website_url: 'https://labs.example',
        },
      })
    })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['/v1/brand-workspaces/me/settings'],
    })
    expect(screen.getByLabelText('Email')).toBeDisabled()
  })

  it('phone_e164 vacío envía null', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.clear(getInput('phone_e164'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith({
        data: { phone_e164: null },
      })
    })
  })

  it('error 422 con fields.website_url muestra error inline y mantiene el form', async () => {
    patchMock.mockRejectedValueOnce(
      new ApiError(422, 'validation_failed', 'Validation failed', {
        field_errors: { website_url: ['invalid_url'] },
      }),
    )
    const user = userEvent.setup()
    renderSection()

    await user.clear(getInput('website_url'))
    await user.type(getInput('website_url'), 'https://invalid.example')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('invalid_url')).toBeInTheDocument()
    expect(getInput('name')).toHaveValue('Marz')
  })

  it('logo cambiado incluye logo_s3_key en el patch', async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(screen.getByRole('button', { name: 'Cambiar logo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith({
        data: { logo_s3_key: 'brand-logos/ws/logo.webp' },
      })
    })
  })

  it('PUT S3 falla no llama patch si no hay otros campos modificados', async () => {
    logoUploaderState.uploadFails = true
    const user = userEvent.setup()
    renderSection()

    await user.click(screen.getByRole('button', { name: 'Cambiar logo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(patchMock).not.toHaveBeenCalled()
  })
})
