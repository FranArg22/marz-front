import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyBlockState } from './EmptyBlockState'

describe('EmptyBlockState', () => {
  it('renders the empty message', () => {
    render(<EmptyBlockState onClear={vi.fn()} />)

    expect(screen.getByText('Sin datos para estos filtros')).toBeInTheDocument()
  })

  it('calls onClear when clearing filters', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    render(<EmptyBlockState onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('exposes the clear action as visible button text', () => {
    render(<EmptyBlockState onClear={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    ).toBeVisible()
  })
})
