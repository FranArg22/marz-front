import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoUploader } from './LogoUploader'

const presignMock = vi.hoisted(() => vi.fn())

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('#/shared/api/generated/identity/identity', () => ({
  usePresignBrandLogo: () => ({
    mutateAsync: presignMock,
    isPending: false,
  }),
}))

function renderUploader(onKeyChange = vi.fn()) {
  render(
    <LogoUploader
      currentLogoUrl={null}
      brandName="Marz Labs"
      onKeyChange={onKeyChange}
    />,
  )
  return { onKeyChange }
}

function makeFile() {
  return new File(['logo'], 'logo.webp', { type: 'image/webp' })
}

describe('LogoUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:logo'),
      revokeObjectURL: vi.fn(),
    })
    presignMock.mockResolvedValue({
      status: 200,
      data: {
        upload_url: 'https://s3.example/upload',
        s3_key: 'brand-logos/ws/logo.webp',
        expires_in: 300,
        required_headers: { 'Content-Type': 'image/webp' },
        max_bytes: 5242880,
      },
      headers: new Headers(),
    })
  })

  it('presign OK + PUT OK llama onKeyChange con la key', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
    const { onKeyChange } = renderUploader()

    const input = document.querySelector('input[type="file"]')
    expect(input).toBeInstanceOf(HTMLInputElement)
    await user.upload(input as HTMLInputElement, makeFile())

    await waitFor(() => {
      expect(presignMock).toHaveBeenCalledWith({
        data: {
          content_type: 'image/webp',
          content_length: 4,
        },
      })
      expect(fetch).toHaveBeenCalledWith('https://s3.example/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: expect.any(File),
      })
      expect(onKeyChange).toHaveBeenCalledWith('brand-logos/ws/logo.webp')
    })
  })

  it('PUT S3 falla no llama onKeyChange y muestra error', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))
    const { onKeyChange } = renderUploader()

    const input = document.querySelector('input[type="file"]')
    expect(input).toBeInstanceOf(HTMLInputElement)
    await user.upload(input as HTMLInputElement, makeFile())

    expect(
      await screen.findByText('Error al subir la imagen. Intentá de nuevo.'),
    ).toBeInTheDocument()
    expect(onKeyChange).not.toHaveBeenCalled()
  })
})
