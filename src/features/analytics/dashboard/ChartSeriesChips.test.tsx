import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChartSeriesChips } from './ChartSeriesChips'

describe('ChartSeriesChips', () => {
  it('allows activating all three series', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <ChartSeriesChips
        activeSeries={['oferta', 'vistas']}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Gasto' })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Gasto' }))

    expect(onChange).toHaveBeenCalledWith(['oferta', 'vistas', 'gasto'])
  })

  it('does not deselect the only active chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<ChartSeriesChips activeSeries={['oferta']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Oferta' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('sets aria-pressed for each chip', () => {
    render(<ChartSeriesChips activeSeries={['oferta']} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Oferta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Vistas' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Gasto' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
