import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { ConfigurationPendingBadge } from './ConfigurationPendingBadge'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

describe('ConfigurationPendingBadge', () => {
  it('renders the pending configuration copy', () => {
    render(<ConfigurationPendingBadge />)

    expect(screen.getByText('Configuración pendiente')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(<ConfigurationPendingBadge />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
