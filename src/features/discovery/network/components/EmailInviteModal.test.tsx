import { render, screen } from '@testing-library/react'
import type { MutationFunctionContext } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDiscoveryEmailInvite,
  useCreateDiscoveryEmailInvite,
} from '#/shared/api/generated/brand/brand'
import { ApiError } from '#/shared/api/mutator'

import { EmailInviteModal } from './EmailInviteModal'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('#/shared/api/generated/brand/brand', () => ({
  createDiscoveryEmailInvite: vi.fn(),
  useCreateDiscoveryEmailInvite: vi.fn(),
}))

const mockCreateDiscoveryEmailInvite = vi.mocked(createDiscoveryEmailInvite)
const mockUseCreateDiscoveryEmailInvite = vi.mocked(
  useCreateDiscoveryEmailInvite,
)
const mockMutate = vi.fn()
const mockReset = vi.fn()
const mutationFunctionContext = {} as MutationFunctionContext

function renderModal() {
  const onOpenChange = vi.fn()
  render(<EmailInviteModal open onOpenChange={onOpenChange} />)
  return { onOpenChange }
}

describe('EmailInviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateDiscoveryEmailInvite.mockReturnValue({
      mutate: mockMutate,
      reset: mockReset,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateDiscoveryEmailInvite>)
  })

  it('shows an inline error and does not call the API for invalid email', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(
      screen.getByText('Ingresá un email válido.'),
    ).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
    expect(mockCreateDiscoveryEmailInvite).not.toHaveBeenCalled()
  })

  it('shows a success toast and closes the modal on success', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce((variables) => {
      const mutationOptions = mockUseCreateDiscoveryEmailInvite.mock.calls[0]?.[0]
        ?.mutation
      mutationOptions?.onSuccess?.(
        {
          status: 201,
          data: {
            email_invite_id: 'email-invite-1',
            status: 'pending',
            expires_at: '2026-06-10T00:00:00Z',
          },
          headers: new Headers(),
        },
        variables,
        undefined,
        mutationFunctionContext,
      )
    })
    const { onOpenChange } = renderModal()

    await user.type(screen.getByLabelText('Email'), 'creator@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(mockMutate).toHaveBeenCalledWith({
      data: {
        invited_email: 'creator@example.com',
        note: null,
      },
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Invitación enviada a creator@example.com',
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows an info toast for 409 already pending', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce(() => {
      const mutationOptions = mockUseCreateDiscoveryEmailInvite.mock.calls[0]?.[0]
        ?.mutation
      mutationOptions?.onError?.(
        new ApiError(409, 'already_pending', 'Already pending'),
        {
          data: {
            invited_email: 'creator@example.com',
            note: null,
          },
        },
        undefined,
        mutationFunctionContext,
      )
    })
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'creator@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(toast.info).toHaveBeenCalledWith(
      'Ya existe una invitación pendiente para ese email.',
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows an inline email error for 422 validation errors', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce(() => {
      const mutationOptions = mockUseCreateDiscoveryEmailInvite.mock.calls[0]?.[0]
        ?.mutation
      mutationOptions?.onError?.(
        new ApiError(422, 'validation.invited_email', 'Invalid email'),
        {
          data: {
            invited_email: 'creator@example.com',
            note: null,
          },
        },
        undefined,
        mutationFunctionContext,
      )
    })
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'creator@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(screen.getByText('El email no es válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-describedby',
      'invite-email-error',
    )
  })

  it('shows a generic error toast for other errors', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementationOnce(() => {
      const mutationOptions = mockUseCreateDiscoveryEmailInvite.mock.calls[0]?.[0]
        ?.mutation
      mutationOptions?.onError?.(
        new Error('Network error'),
        {
          data: {
            invited_email: 'creator@example.com',
            note: null,
          },
        },
        undefined,
        mutationFunctionContext,
      )
    })
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'creator@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(toast.error).toHaveBeenCalledWith('Algo salió mal. Intentá de nuevo.')
  })

  it('resets the form when the modal closes', async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderModal()

    await user.type(screen.getByLabelText('Email'), 'creator@example.com')
    await user.type(
      screen.getByLabelText('Nota (opcional)'),
      'Quiero invitarte',
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Nota (opcional)')).toHaveValue('')
    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
