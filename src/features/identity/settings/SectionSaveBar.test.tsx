import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SectionSaveBar } from './SectionSaveBar'

describe('SectionSaveBar', () => {
  it('disables save when section is not dirty', () => {
    render(
      <SectionSaveBar
        isDirty={false}
        isSubmitting={false}
        error={null}
        onSave={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('enables save when section is dirty', async () => {
    const onSave = vi.fn()

    render(
      <SectionSaveBar
        isDirty
        isSubmitting={false}
        error={null}
        onSave={onSave}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('shows inline error below the save action', () => {
    render(
      <SectionSaveBar
        isDirty
        isSubmitting={false}
        error="mensaje"
        onSave={() => {}}
      />,
    )

    expect(screen.getByText('mensaje')).toBeInTheDocument()
  })
})
