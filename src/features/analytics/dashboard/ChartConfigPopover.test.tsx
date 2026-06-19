import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChartConfigPopover } from './ChartConfigPopover'

describe('ChartConfigPopover', () => {
  it("disables 'Mes' when range_preset is 7d", async () => {
    const user = userEvent.setup()

    render(
      <ChartConfigPopover
        currentGrouping="day"
        currentPreset="7d"
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Configuración' }))

    expect(screen.getByRole('menuitemradio', { name: 'Mes' })).toBeDisabled()
  })

  it('enables every option when range_preset is 30d', async () => {
    const user = userEvent.setup()

    render(
      <ChartConfigPopover
        currentGrouping="day"
        currentPreset="30d"
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Configuración' }))

    expect(screen.getByRole('menuitemradio', { name: 'Día' })).not.toBeDisabled()
    expect(
      screen.getByRole('menuitemradio', { name: 'Semana' }),
    ).not.toBeDisabled()
    expect(screen.getByRole('menuitemradio', { name: 'Mes' })).not.toBeDisabled()
  })
})
