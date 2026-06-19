import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorBlockState } from './ErrorBlockState'

describe('ErrorBlockState', () => {
  it('renders the error message', () => {
    render(<ErrorBlockState onRetry={vi.fn()} />)

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
  })

  it('calls onRetry when retrying', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<ErrorBlockState onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('exposes the retry action as visible button text', () => {
    render(<ErrorBlockState onRetry={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  })
})
