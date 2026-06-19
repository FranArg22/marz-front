import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Flag } from './Flag'

describe('Flag', () => {
  it('renders a bundled twemoji svg for a valid country code', () => {
    const { container } = render(<Flag country="AR" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBeTruthy()
  })

  it('is case-insensitive on the country code', () => {
    const { container } = render(<Flag country="ar" />)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('renders nothing for an invalid country code', () => {
    const { container } = render(<Flag country="" />)
    expect(container.querySelector('img')).toBeNull()
  })
})
